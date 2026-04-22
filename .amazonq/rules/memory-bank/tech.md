# Technology Stack

## Languages & Runtimes
- TypeScript 5.3 — backend and frontend
- Python 3.x — scraper and analysis
- SQL (PostgreSQL 15)

## Backend
- Runtime: Node.js 20
- Framework: Express 4.18
- ORM/DB: `pg` (raw SQL with parameterized queries)
- Auth: `jsonwebtoken` (JWT) + `bcrypt`
- File upload: `multer` + `pdf-parse`
- Notifications: `nodemailer` (email) + `node-telegram-bot-api`
- HTTP client: `axios`
- Dev server: `ts-node-dev`

## Frontend
- Framework: React 18 + Vite 5
- Routing: `react-router-dom` v6
- Styling: Tailwind CSS 3
- HTTP client: `axios`
- Build: `tsc && vite build`

## Scraper
- Framework: Scrapy 2.11
- Browser automation: `scrapy-playwright` + `playwright` (for JS-heavy sites)
- HTTP: `requests`

## AI / ML
- Local LLM: Ollama (model: `gemma:2b`) at `http://localhost:11434`
- Prompt templates: JSON files in `ai/prompts/`
- Analysis: Python (pandas, matplotlib implied) in `docs/analysis/job_analysis.py`

## Infrastructure
- Database: PostgreSQL 15 (Docker or local socket at `/tmp`)
- Containerization: Docker Compose (postgres, backend, frontend, scraper services)
- Dev environment: GitHub Codespaces (devcontainer)

## Development Commands

### Backend
```bash
cd backend
npm run dev      # ts-node-dev with hot reload
npm run build    # tsc compile
npm start        # run compiled dist/server.js
```

### Frontend
```bash
cd frontend
npm run dev      # vite dev server (port 3000)
npm run build    # tsc + vite build
npm run preview  # preview production build
```

### Scraper
```bash
cd scraper
python3 -m scrapy crawl remoteok     # single spider
python3 scheduler_optimized.py       # run all spiders with priority scheduling
```

### Database
```bash
psql -h /tmp -U vscode -d job_ai     # local dev connection
# Docker: postgres exposed on port 5432
```

### Full Stack (Docker)
```bash
docker-compose up --build
```

## Environment Variables (backend/.env)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `OLLAMA_URL` (default: `http://host.docker.internal:11434`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
