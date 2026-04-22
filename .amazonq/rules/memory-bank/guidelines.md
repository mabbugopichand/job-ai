# Development Guidelines

## Code Quality Standards

### TypeScript (Backend & Frontend)
- No ORM — use raw parameterized SQL via `query(sql, params)` from `../db`
- Always use `$1, $2, ...` placeholders; never interpolate user input into SQL strings
- Dynamic query building: accumulate params array and increment `paramIndex` counter
- Use `ON CONFLICT ... DO NOTHING` or `DO UPDATE SET` for upserts — never check-then-insert
- Batch async DB calls with `Promise.all([...])` when queries are independent
- Route handlers: always `try/catch`, return `res.status(500).json({ error: '...' })` on failure
- Return 400 for missing/invalid input before hitting the DB
- Auth routes use `authMiddleware` and `AuthRequest` (extends `Request` with `userId`)
- Export router as default: `export default router`

### React / TSX (Frontend)
- Single default export per file, named after the component (e.g., `export default function ProfileSettings()`)
- State: one `useState` object for related form fields, separate state for UI flags (`saved`, `error`, `parsing`)
- Data fetching in `useEffect` with empty deps `[]`; silently ignore errors with `.catch(() => {})`
- Functional updates for state derived from previous state: `setFormData(f => ({ ...f, key: val }))`
- Dedup arrays with `Array.from(new Set([...existing, ...new]))` before setting state
- Conditional rendering with `&&` for optional sections (e.g., Telegram chat ID field)
- Tailwind utility classes only — no CSS modules or inline styles
- Form submit: `e.preventDefault()`, clear error, `try/catch`, show success feedback with `setTimeout` reset

### Python (Scraper)
- Module-level `logger = logging.getLogger(__name__)` — never use `print()` in pipeline/spider code
- Scheduler uses `logging.basicConfig` with `format='%(asctime)s [%(levelname)s] %(message)s'`
- Pipeline classes: implement `process_item(self, item, spider)` and `close_spider(self, spider)` for stats logging
- Raise `DropItem(reason)` to filter items — never return `None`
- Use `subprocess.run(..., capture_output=True, text=True, timeout=N)` for external process calls
- Parallelism: `ProcessPoolExecutor` for CPU-bound (spider processes), `ThreadPoolExecutor` for I/O-bound (HTTP batches)
- `as_completed(futures)` pattern for collecting parallel results
- Environment config via `os.environ.get('KEY', 'default')` — never hardcode URLs or secrets
- Graceful degradation: wrap optional integrations (Redis, DB) in `try/except` with `logger.warning` fallback

## Naming Conventions

### TypeScript
- camelCase for variables, functions, parameters
- PascalCase for React components, interfaces, types
- SCREAMING_SNAKE_CASE for module-level constants (e.g., `INGEST_SECRET`)
- Route files named by resource: `jobs.ts`, `auth.ts`, `applications.ts`

### Python
- snake_case for all variables, functions, class methods
- PascalCase for class names (e.g., `TechJobFilterPipeline`, `AsyncBatchPipeline`)
- SCREAMING_SNAKE_CASE for module-level config dicts and sets (e.g., `SPIDER_CONFIG`, `TECH_KEYWORDS`, `NON_TECH_ROLES`)
- Spider names match Scrapy `name` attribute and dict keys (lowercase, no underscores: `remoteok`, `jobicy`)

## Architectural Patterns

### API Design
- All routes prefixed by resource under `/api/<resource>`
- Ingest endpoint (`POST /api/jobs/ingest`) is unauthenticated but optionally secret-protected via `x-ingest-secret` header
- Search endpoints build dynamic WHERE clauses with parameterized index tracking
- Analytics endpoints use `Promise.all` for parallel DB queries, return structured JSON with named keys

### Scraper Pipeline Order (priority number = execution order)
```
TechJobFilterPipeline (50) → CleaningPipeline (100) → DeduplicationPipeline (200) → AsyncBatchPipeline (300)
```
- Filter early (priority 50) to avoid wasted processing downstream
- Dedup key priority: URL > external_id > title+company
- Batch size: 100 jobs, up to 5 concurrent batches via `ThreadPoolExecutor`

### Database Patterns
- JSONB for variable-length arrays: `skills`, `preferred_roles`, `extracted_skills`, `missing_skills`
- Dedup at DB level: `UNIQUE(dedup_key)` on jobs, `UNIQUE(job_id, user_id)` on ai_scores
- Bulk operations via PostgreSQL stored procedure: `bulk_insert_jobs($1::JSONB)`
- Indexes on high-cardinality filter columns: `role_type`, `work_mode`, `location`, `posted_date`, `is_active`

### AI Integration
- AI scoring is on-demand (user-triggered via `POST /api/jobs/:id/analyze`)
- Ollama endpoint: `OLLAMA_URL` env var, model `gemma:2b`, JSON format response
- Score threshold for alerts: `match_score >= 75` → `should_alert = true`
- After scoring: conditionally send Telegram + email alerts, then insert into `alerts` table

## Section Separators
Both Python and TypeScript files use visual section separators for logical grouping:
```python
# ============================================================================
# SECTION NAME
# ============================================================================
```
Use these for files with 3+ distinct logical sections (config, execution, CLI; or routes, helpers, exports).

## Error Handling
- Backend routes: always catch and return `{ error: 'message' }` with appropriate HTTP status
- Scraper pipelines: log errors with `logger.error(...)`, never crash the pipeline — return item or raise DropItem
- Frontend: set `error` state string for display, never throw unhandled rejections
- Optional services (Redis, Telegram, email): wrap in try/catch, log warning, continue without them

## Configuration & Secrets
- All secrets via environment variables — never hardcoded
- Backend reads from `process.env.*`; scraper reads from `os.environ.get('KEY', 'default')`
- Docker Compose passes env vars to each service; local dev uses `backend/.env`
