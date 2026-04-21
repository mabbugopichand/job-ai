import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT a.*, j.title, j.company, j.location, ai.match_score, ai.summary
       FROM alerts a
       JOIN jobs j ON a.job_id = j.id
       JOIN ai_scores ai ON a.ai_score_id = ai.id
       WHERE a.user_id = $1
       ORDER BY a.sent_at DESC
       LIMIT 100`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE alerts SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
