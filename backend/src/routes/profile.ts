import { Router } from 'express';
import multer from 'multer';
const pdfParse = require('pdf-parse');
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// All known roles and their associated keywords
const ROLE_KEYWORDS: Record<string, string[]> = {
  'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'next.js', 'svelte', 'webpack', 'ui', 'ux'],
  'Backend': ['node', 'express', 'django', 'flask', 'rails', 'spring', 'java', 'python', 'php', 'ruby', 'rest api', 'graphql', 'postgresql', 'mysql', 'mongodb'],
  'Full Stack': ['full stack', 'fullstack', 'mern', 'mean', 'lamp', 'react', 'node', 'django', 'rails'],
  'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'aws', 'gcp', 'azure', 'linux', 'bash', 'devops', 'sre', 'infrastructure'],
  'Data Science': ['pandas', 'numpy', 'scikit', 'r ', 'statistics', 'data analysis', 'tableau', 'power bi', 'sql', 'data science', 'jupyter', 'matplotlib'],
  'AI/ML': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'neural network', 'llm', 'transformers', 'huggingface', 'ai', 'ml'],
  'Mobile': ['ios', 'android', 'swift', 'kotlin', 'react native', 'flutter', 'mobile', 'xcode'],
  'Design': ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'ui design', 'ux design', 'wireframe', 'prototyping', 'design system'],
  'Product': ['product manager', 'product owner', 'roadmap', 'agile', 'scrum', 'jira', 'stakeholder', 'product strategy'],
  'Marketing': ['seo', 'sem', 'google ads', 'facebook ads', 'content marketing', 'email marketing', 'growth hacking', 'analytics', 'hubspot'],
  'Research': ['research', 'phd', 'postdoc', 'publication', 'academic', 'laboratory', 'experiment', 'thesis', 'dissertation', 'grant'],
  'PhD Position': ['phd', 'doctoral', 'dissertation', 'thesis', 'research proposal'],
  'Postdoctoral Researcher': ['postdoc', 'post-doctoral', 'postdoctoral', 'research fellow'],
};

const SKILL_PATTERNS = [
  'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin','scala',
  'react','vue','angular','next.js','svelte','node.js','express','django','flask','fastapi','spring',
  'postgresql','mysql','mongodb','redis','elasticsearch','sqlite',
  'docker','kubernetes','terraform','ansible','jenkins','github actions','ci/cd',
  'aws','gcp','azure','s3','ec2','lambda',
  'machine learning','deep learning','tensorflow','pytorch','scikit-learn','pandas','numpy',
  'nlp','computer vision','llm','transformers',
  'react native','flutter','ios','android',
  'figma','sketch','adobe xd',
  'git','linux','bash','sql','graphql','rest api','microservices',
  'agile','scrum','jira','confluence',
];

function extractAndScore(text: string) {
  const lower = text.toLowerCase();
  const extractedSkills = SKILL_PATTERNS.filter(skill => lower.includes(skill.toLowerCase()));
  const roleScores: { role: string; score: number }[] = [];
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const matches = keywords.filter(k => lower.includes(k.toLowerCase()));
    if (matches.length > 0) roleScores.push({ role, score: matches.length });
  }
  roleScores.sort((a, b) => b.score - a.score);
  return { skills: extractedSkills, suggested_roles: roleScores.slice(0, 5).map(r => r.role), resume_text: text };
}

// Upload PDF file
router.post('/upload-resume', authMiddleware, upload.single('resume'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    let text = '';
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } else if (req.file.mimetype === 'text/plain') {
      text = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Only PDF and plain text files are supported' });
    }
    res.json(extractAndScore(text));
  } catch {
    res.status(400).json({ error: 'Failed to parse file' });
  }
});

router.post('/parse-resume', authMiddleware, async (req: AuthRequest, res) => {
  const { resume_text } = req.body;
  if (!resume_text || typeof resume_text !== 'string') {
    return res.status(400).json({ error: 'resume_text is required' });
  }
  if (resume_text.length > 50000) {
    return res.status(400).json({ error: 'resume_text too large (max 50000 chars)' });
  }
  res.json(extractAndScore(resume_text));
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    res.json(result.rows[0] || {});
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/', authMiddleware, async (req: AuthRequest, res) => {
  const {
    resume_text, skills, experience_years, education_level, preferred_roles,
    preferred_locations, preferred_work_modes, min_salary, telegram_chat_id,
    email_notifications, telegram_notifications
  } = req.body;

  try {
    const result = await query(
      `UPDATE profiles SET
       resume_text = COALESCE($1, resume_text),
       skills = COALESCE($2, skills),
       experience_years = COALESCE($3, experience_years),
       education_level = COALESCE($4, education_level),
       preferred_roles = COALESCE($5, preferred_roles),
       preferred_locations = COALESCE($6, preferred_locations),
       preferred_work_modes = COALESCE($7, preferred_work_modes),
       min_salary = COALESCE($8, min_salary),
       telegram_chat_id = COALESCE($9, telegram_chat_id),
       email_notifications = COALESCE($10, email_notifications),
       telegram_notifications = COALESCE($11, telegram_notifications),
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $12
       RETURNING *`,
      [resume_text, JSON.stringify(skills), experience_years, education_level,
       JSON.stringify(preferred_roles), JSON.stringify(preferred_locations),
       JSON.stringify(preferred_work_modes), min_salary, telegram_chat_id,
       email_notifications, telegram_notifications, req.userId]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
