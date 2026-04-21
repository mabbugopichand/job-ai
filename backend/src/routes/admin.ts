import { Router } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/sources', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM job_sources ORDER BY name');
    res.json(result.rows);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/sources', authMiddleware, async (req, res) => {
  const { name, base_url, source_type, scrape_frequency_hours } = req.body;

  try {
    const result = await query(
      'INSERT INTO job_sources (name, base_url, source_type, scrape_frequency_hours) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, base_url, source_type, scrape_frequency_hours || 24]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const jobCount = await query('SELECT COUNT(*) as count FROM jobs WHERE is_active = true');
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const applicationCount = await query('SELECT COUNT(*) as count FROM applications');
    const alertCount = await query('SELECT COUNT(*) as count FROM alerts WHERE is_read = false');

    res.json({
      total_jobs: parseInt(jobCount.rows[0].count),
      total_users: parseInt(userCount.rows[0].count),
      total_applications: parseInt(applicationCount.rows[0].count),
      unread_alerts: parseInt(alertCount.rows[0].count)
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
