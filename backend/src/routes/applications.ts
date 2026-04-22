import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT a.*, j.title, j.company, j.location, j.url
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { job_id, status, applied_date, resume_version, cover_letter, notes } = req.body;
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });
  try {
    const result = await query(
      `INSERT INTO applications (user_id, job_id, status, applied_date, resume_version, cover_letter, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, job_id, status || 'applied', applied_date, resume_version, cover_letter, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { status, notes } = req.body;
  try {
    const result = await query(
      `UPDATE applications SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [status, notes, req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.post('/saved', authMiddleware, async (req: AuthRequest, res) => {
  const { job_id, notes } = req.body;
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });
  try {
    const result = await query(
      'INSERT INTO saved_jobs (user_id, job_id, notes) VALUES ($1, $2, $3) ON CONFLICT (user_id, job_id) DO NOTHING RETURNING *',
      [req.userId, job_id, notes]
    );
    res.status(201).json(result.rows[0] || { message: 'Already saved' });
  } catch {
    res.status(500).json({ error: 'Failed to save job' });
  }
});

router.get('/saved', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT s.*, j.*, ai.match_score
       FROM saved_jobs s
       JOIN jobs j ON s.job_id = j.id
       LEFT JOIN ai_scores ai ON j.id = ai.job_id AND ai.user_id = s.user_id
       WHERE s.user_id = $1
       ORDER BY s.saved_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

export default router;
