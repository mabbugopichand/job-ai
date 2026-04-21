import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { generateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email, password_hash, full_name]
    );

    const user = result.rows[0];
    await query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name }, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
