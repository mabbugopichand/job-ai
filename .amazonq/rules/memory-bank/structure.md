# Project Structure

## Directory Layout
```
job-ai/
├── backend/          # Node.js/Express REST API
│   └── src/
│       ├── db/       # PostgreSQL connection pool
│       ├── middleware/  # JWT auth middleware
│       ├── routes/   # API route handlers
│       ├── services/ # AI and notification services
│       └── types/    # Shared TypeScript types
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── components/  # Feature-based component folders
│       │   ├── Alerts/
│       │   ├── Analytics/
│       │   ├── Applications/
│       │   ├── Auth/
│       │   ├── Dashboard/
│       │   ├── Jobs/
│       │   ├── Profile/
│       │   └── Research/
│       ├── services/    # Axios API client (api.ts)
│       └── types/       # Shared TypeScript types
├── scraper/          # Python Scrapy scraping system
│   ├── job_scraper/
│   │   ├── spiders/  # One spider per job board
│   │   ├── items.py  # Scrapy item definitions
│   │   ├── pipelines.py  # Processing pipeline chain
│   │   └── settings.py
│   ├── scheduler.py           # Basic scheduler
│   └── scheduler_optimized.py # Priority-based scheduler
├── database/         # SQL schema, seeds, and optimizations
├── docs/             # Architecture docs and analysis scripts
│   └── analysis/     # job_analysis.py + generated charts
├── ai/prompts/       # Ollama prompt templates (JSON)
├── scripts/          # setup.sh
└── docker-compose.yml
```

## Core Components

### Backend Routes
- `auth.ts` — register, login, JWT issuance
- `jobs.ts` — ingest (scraper), search, analyze (AI scoring), save
- `applications.ts` — CRUD for application tracking
- `alerts.ts` — read/mark alerts
- `profile.ts` — profile + resume upload
- `admin.ts` — admin-only endpoints

### Scraper Pipeline Chain (ordered by priority)
1. `RoleFilterPipeline` (50) — drops non-tech roles before backend
2. `CleaningPipeline` (100) — normalizes text fields
3. `DeduplicationPipeline` (200) — in-session dedup by key
4. `BackendPipeline` (300) — batches 10 jobs → POST /api/jobs/ingest

### Database Tables
`users` → `profiles`, `jobs` (via `job_sources`) → `ai_scores`, `alerts`, `saved_jobs`, `applications` → `followups`, `job_skills`, `research_tracks`

## Architectural Patterns
- Frontend never accesses DB directly — all data via REST API
- AI scoring is on-demand (user-triggered) or batch (scheduler)
- Scraper is a separate service that pushes to backend via HTTP
- Deduplication at two levels: scraper pipeline (in-memory) and DB (`ON CONFLICT DO NOTHING`)
- JSONB columns for flexible arrays (skills, preferred_roles, extracted_skills)
