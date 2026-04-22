import { Router } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/sources', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM job_sources ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

router.post('/sources', authMiddleware, async (req, res) => {
  const { name, base_url, source_type, scrape_frequency_hours } = req.body;
  if (!name || !base_url) return res.status(400).json({ error: 'name and base_url are required' });
  try {
    const result = await query(
      'INSERT INTO job_sources (name, base_url, source_type, scrape_frequency_hours) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, base_url, source_type, scrape_frequency_hours || 24]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create source' });
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
