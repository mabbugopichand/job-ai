import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { analyzeJobMatch } from '../services/ai.service';
import { sendTelegramAlert, sendEmailAlert } from '../services/notification.service';

const router = Router();

const INGEST_SECRET = process.env.INGEST_SECRET;

router.post('/ingest', async (req, res) => {
  if (INGEST_SECRET) {
    const provided = req.headers['x-ingest-secret'];
    if (provided !== INGEST_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const jobs = req.body.jobs;
  
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ error: 'Jobs array is required' });
  }

  if (jobs.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 jobs per request' });
  }
  
  try {
    const startTime = Date.now();
    const result = await query(
      'SELECT * FROM bulk_insert_jobs($1::JSONB)',
      [JSON.stringify(jobs)]
    );
    const duration = Date.now() - startTime;
    const stats = result.rows[0];
    res.json({
      inserted: stats.inserted_count,
      updated: stats.updated_count,
      skipped: stats.skipped_count,
      total: jobs.length,
      duration_ms: duration,
      jobs_per_second: Math.round((jobs.length / duration) * 1000)
    });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Failed to ingest jobs' });
  }
});

router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  const { keyword, role_type, work_mode, location, min_score, limit = 20, offset = 0 } = req.query;

  try {
    const params: any[] = [req.userId];
    let paramIndex = 2;
    let whereClause = 'WHERE j.is_active = true';

    if (keyword) {
      whereClause += ` AND (
        to_tsvector('english', coalesce(j.title,'') || ' ' || coalesce(j.company,'') || ' ' || coalesce(j.description,'') || ' ' || coalesce(j.requirements,''))
        @@ plainto_tsquery('english', $${paramIndex++})
      )`;
      params.push(keyword);
    }
    if (role_type) {
      whereClause += ` AND j.role_type = $${paramIndex++}`;
      params.push(role_type);
    }
    if (work_mode) {
      whereClause += ` AND j.work_mode = $${paramIndex++}`;
      params.push(work_mode);
    }
    if (location) {
      whereClause += ` AND j.location ILIKE $${paramIndex++}`;
      params.push(`%${location}%`);
    }
    if (min_score) {
      whereClause += ` AND ai.match_score >= $${paramIndex++}`;
      params.push(min_score);
    }

    const baseQuery = `
      FROM jobs j
      LEFT JOIN ai_scores ai ON j.id = ai.job_id AND ai.user_id = $1
      ${whereClause}
    `;

    const countResult = await query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT j.*, ai.match_score, ai.summary, ai.role_classification ${baseQuery}
       ORDER BY j.posted_date DESC NULLS LAST, j.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    res.json({ jobs: dataResult.rows, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

router.get('/analytics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [roleStats, workModeStats, salaryStats, topSkills, recentActivity] = await Promise.all([
      query(`SELECT role_type, COUNT(*) as count FROM jobs WHERE is_active = true GROUP BY role_type ORDER BY count DESC LIMIT 10`),
      query(`SELECT work_mode, COUNT(*) as count FROM jobs WHERE is_active = true GROUP BY work_mode`),
      query(`SELECT role_type,
               ROUND(AVG(salary_min)) as avg_salary_min,
               ROUND(AVG(salary_max)) as avg_salary_max
             FROM jobs WHERE salary_min IS NOT NULL AND is_active = true
             GROUP BY role_type ORDER BY avg_salary_max DESC LIMIT 8`),
      query(`SELECT js.skill_name, COUNT(*) as count
             FROM job_skills js JOIN jobs j ON js.job_id = j.id
             WHERE j.is_active = true
             GROUP BY js.skill_name ORDER BY count DESC LIMIT 15`),
      query(`SELECT DATE(created_at) as date, COUNT(*) as count
             FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(created_at) ORDER BY date ASC`),
    ]);

    const appStats = await query(
      `SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status`,
      [req.userId]
    );

    const scoreStats = await query(
      `SELECT
         COUNT(*) as total_scored,
         ROUND(AVG(match_score)) as avg_score,
         COUNT(*) FILTER (WHERE match_score >= 75) as high_matches
       FROM ai_scores WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      roles: roleStats.rows,
      work_modes: workModeStats.rows,
      salary_by_role: salaryStats.rows,
      top_skills: topSkills.rows,
      jobs_over_time: recentActivity.rows,
      application_status: appStats.rows,
      score_summary: scoreStats.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT j.*, ai.match_score, ai.summary, ai.reasoning, ai.extracted_skills, ai.missing_skills
       FROM jobs j
       LEFT JOIN ai_scores ai ON j.id = ai.job_id AND ai.user_id = $1
       WHERE j.id = $2`,
      [req.userId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.post('/:id/analyze', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    const profileResult = await query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (jobResult.rows.length === 0 || profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job or profile not found' });
    }
    const job = jobResult.rows[0];
    const profile = profileResult.rows[0];
    const analysis = await analyzeJobMatch(job, profile);
    const scoreResult = await query(
      `INSERT INTO ai_scores (job_id, user_id, match_score, role_classification, extracted_skills,
       missing_skills, summary, reasoning, should_alert, ai_model)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (job_id, user_id) DO UPDATE SET
       match_score = $3, role_classification = $4, extracted_skills = $5, missing_skills = $6,
       summary = $7, reasoning = $8, should_alert = $9, ai_model = $10
       RETURNING *`,
      [req.params.id, req.userId, analysis.match_score, analysis.role_classification,
       JSON.stringify(analysis.extracted_skills), JSON.stringify(analysis.missing_skills),
       analysis.summary, analysis.reasoning, analysis.should_alert, 'gemma']
    );
    const score = scoreResult.rows[0];
    if (analysis.should_alert) {
      const userResult = await query('SELECT email FROM users WHERE id = $1', [req.userId]);
      if (profile.telegram_notifications && profile.telegram_chat_id) {
        await sendTelegramAlert(profile.telegram_chat_id, job, score);
      }
      if (profile.email_notifications) {
        await sendEmailAlert(userResult.rows[0].email, job, score);
      }
      await query(
        'INSERT INTO alerts (user_id, job_id, ai_score_id, alert_type, sent_via) VALUES ($1, $2, $3, $4, $5)',
        [req.userId, job.id, score.id, 'high_match', profile.telegram_notifications ? 'telegram,email' : 'email']
      );
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
