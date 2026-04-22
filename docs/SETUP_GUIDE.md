# Job-AI Platform - Complete Setup Guide

## 🚀 Quick Start (Current Environment - Alpine Linux)

The application is **already running**! Here's what's active:

- ✅ **PostgreSQL**: Running on `/tmp` socket (port 5432)
- ✅ **Backend API**: http://localhost:5000
- ⏳ **Frontend**: Not started yet
- ⏳ **Scraper**: Ready to run

---

## 📋 Prerequisites

### Already Installed
- ✅ Node.js v24.14.1
- ✅ npm v11.11.0
- ✅ PostgreSQL 18.3
- ✅ Python 3.12 + data science libraries (pandas, matplotlib, seaborn, scikit-learn)

### Optional (for AI features)
- Ollama (for local AI job matching) - Install from https://ollama.ai
- Run: `ollama pull gemma:2b`

---

## 🏃 Running the Application

### Option 1: Quick Start (Recommended)

```bash
# Start everything at once
cd /workspaces/job-ai
bash start.sh
```

### Option 2: Manual Start (Step by Step)

#### 1. Start PostgreSQL (if not running)
```bash
pg_ctl -D /tmp/pgdata -o "-k /tmp" -l /tmp/pgdata/pg.log start
```

#### 2. Start Backend API
```bash
cd /workspaces/job-ai/backend
npm run dev
# Backend runs on http://localhost:5000
```

#### 3. Start Frontend (in new terminal)
```bash
cd /workspaces/job-ai/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

#### 4. Run Data Analysis
```bash
cd /workspaces/job-ai
python3 docs/analysis/job_analysis.py
# Charts saved to docs/analysis/
```

#### 5. Run Job Scraper (optional)
```bash
cd /workspaces/job-ai/scraper
python3 -m scrapy crawl remoteok
# Or run scheduler: python3 scheduler.py
```

---

## 🗄️ Database Setup

Database is **already initialized** with:
- Schema: All tables created (users, jobs, ai_scores, applications, etc.)
- Seed data: 8 job sources loaded

### Manual Database Commands
```bash
# Connect to database
psql -h /tmp -U vscode -d job_ai

# View tables
\dt

# Check job sources
SELECT * FROM job_sources;

# Reset database (if needed)
psql -h /tmp -U vscode -d job_ai -f database/schema.sql
psql -h /tmp -U vscode -d job_ai -f database/seed.sql
```

---

## 🔧 Configuration

### Backend Environment Variables
Edit `backend/.env`:
```env
PORT=5000
DB_HOST=/tmp                    # Unix socket path
DB_PORT=5432
DB_NAME=job_ai
DB_USER=vscode
DB_PASSWORD=
JWT_SECRET=dev-secret-key       # Change in production!
OLLAMA_URL=http://localhost:11434

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: Telegram alerts
TELEGRAM_BOT_TOKEN=your-bot-token
```

### Frontend Environment Variables
Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 Data Analysis Features

The platform includes a complete end-to-end data analysis pipeline:

### Run Analysis
```bash
cd /workspaces/job-ai
python3 docs/analysis/job_analysis.py
```

### Generated Outputs
All saved to `docs/analysis/`:
- `chart1_match_by_source.png` - Avg match score by job source
- `chart2_weekly_trend.png` - Weekly job posting trends
- `chart3_boxplot_roles.png` - Match score distribution by role
- `chart4_correlation_heatmap.png` - Feature correlations
- `chart5_clusters.png` - Job clusters (salary vs match score)
- `chart6_alert_by_workmode.png` - Alert rate by work mode

### Key Insights from Analysis
1. **Tech roles score 20 points higher** than non-tech roles (p<0.001)
2. **Nature Careers has highest avg score** (58.9) despite being research-focused
3. **WeWorkRemotely has lowest alert rate** (16.5%) - deprioritized in scheduler
4. **Salary doesn't correlate with match score** (r=-0.015)
5. **Role type is the only significant predictor** of match quality

---

## 🕷️ Scraper Configuration

### Available Spiders
```bash
cd /workspaces/job-ai/scraper

# Run individual spiders
scrapy crawl remoteok      # RemoteOK jobs
scrapy crawl jobicy        # Jobicy jobs
scrapy crawl arbeitnow     # Arbeitnow jobs
scrapy crawl themuse       # TheMuse jobs
```

### Automated Scheduling
```bash
# Run scheduler (scrapes every 6 hours + weekly analysis)
python3 scheduler.py
```

**Smart Features:**
- High-signal sources (RemoteOK, Jobicy) run every cycle
- Low-signal sources (Arbeitnow, TheMuse) run every other cycle
- Non-tech roles filtered before AI scoring (saves ~36% API cost)
- Weekly analysis runs every Monday

---

## 🧪 Testing the Application

### 1. Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# Get admin stats
curl http://localhost:5000/api/admin/stats

# Search jobs (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/jobs/search?keyword=devops&limit=5"
```

### 2. Test Database
```bash
psql -h /tmp -U vscode -d job_ai -c "SELECT COUNT(*) FROM jobs;"
psql -h /tmp -U vscode -d job_ai -c "SELECT name, is_active FROM job_sources;"
```

### 3. Test Scraper
```bash
cd /workspaces/job-ai/scraper
scrapy crawl remoteok -o /tmp/test_jobs.json
cat /tmp/test_jobs.json | head -20
```

---

## 📱 Using the Application

### 1. Register/Login
- Open http://localhost:3000
- Create account or login
- Set up your profile with skills and preferences

### 2. Search Jobs
- Browse jobs by keyword, role, location, work mode
- Filter by minimum match score
- View detailed job descriptions

### 3. AI Job Matching
- Click "Analyze Match" on any job
- Get AI-powered match score (0-100)
- See extracted skills, missing skills, and reasoning
- High matches (≥75) trigger automatic alerts

### 4. Track Applications
- Save interesting jobs
- Mark jobs as applied
- Track application status (applied → screening → interview → offer)
- Add notes and follow-ups

### 5. View Analytics
- Dashboard shows job market trends
- Top skills in demand
- Salary ranges by role
- Your application pipeline

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
tail -f /tmp/backend.log

# Check if port 5000 is in use
lsof -i :5000
pkill -f "ts-node-dev"

# Restart
cd /workspaces/job-ai/backend
npm run dev
```

### Frontend won't start
```bash
# Check logs
tail -f /tmp/frontend.log

# Check if port 3000 is in use
lsof -i :3000
pkill -f "vite"

# Restart
cd /workspaces/job-ai/frontend
npm run dev
```

### PostgreSQL issues
```bash
# Check if running
pg_ctl -D /tmp/pgdata status

# View logs
tail -f /tmp/pgdata/pg.log

# Restart
pg_ctl -D /tmp/pgdata -o "-k /tmp" restart
```

### Database connection errors
```bash
# Verify socket path
ls -la /tmp/.s.PGSQL.5432

# Test connection
psql -h /tmp -U vscode -d job_ai -c "SELECT 1;"

# Check backend .env has correct DB_HOST=/tmp
cat backend/.env | grep DB_HOST
```

### Scraper errors
```bash
# Install missing dependencies
cd /workspaces/job-ai/scraper
pip install -r requirements.txt

# Test with verbose output
scrapy crawl remoteok -L DEBUG
```

---

## 📂 Project Structure

```
job-ai/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # AI matching, notifications
│   │   ├── db/          # PostgreSQL connection
│   │   └── middleware/  # Auth, validation
│   └── package.json
├── frontend/            # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
│   └── package.json
├── scraper/             # Scrapy job scrapers
│   ├── job_scraper/
│   │   ├── spiders/     # Job board spiders
│   │   ├── pipelines.py # Data processing + filtering
│   │   └── settings.py  # Scrapy config
│   ├── scheduler.py     # Automated scraping
│   └── requirements.txt
├── database/
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Initial data
├── docs/
│   └── analysis/        # Data analysis + charts
│       └── job_analysis.py
├── ai/
│   └── prompts/         # AI prompt templates
└── scripts/
    └── setup.sh         # Setup automation
```

---

## 🔐 Security Notes

**⚠️ For Development Only**

Current setup uses:
- Default JWT secret (change in production!)
- Trust authentication for PostgreSQL
- No HTTPS (use reverse proxy in production)
- No rate limiting (add in production)

**Production Checklist:**
- [ ] Change JWT_SECRET to strong random value
- [ ] Configure PostgreSQL with password authentication
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Add rate limiting middleware
- [ ] Enable CORS only for your domain
- [ ] Use environment-specific .env files
- [ ] Set up database backups
- [ ] Configure log rotation

---

## 📈 Performance Optimizations (from Analysis)

### Implemented
1. ✅ **Role filtering pipeline** - Skips non-tech roles before AI scoring (saves ~36% API cost)
2. ✅ **Source prioritization** - High-signal sources run more frequently
3. ✅ **Smart scheduling** - Low-signal sources run every other cycle

### Recommended
- Add Redis caching for job search results
- Implement database connection pooling (already configured, max 20)
- Add full-text search indexes on job descriptions
- Batch AI scoring for multiple jobs
- Implement job deduplication at database level (already has dedup_key)

---

## 🤝 Contributing

### Adding a New Job Source Spider

1. Create spider file:
```python
# scraper/job_scraper/spiders/newsite_spider.py
from job_scraper.spiders.base_spider import BaseJobSpider

class NewSiteSpider(BaseJobSpider):
    name = 'newsite'
    start_urls = ['https://newsite.com/jobs']
    
    def __init__(self, *args, **kwargs):
        super().__init__(source_id=9, *args, **kwargs)  # Get ID from job_sources table
    
    def parse(self, response):
        # Extract job data
        yield self.create_job_item(
            external_id='...',
            title='...',
            company='...',
            # ... other fields
        )
```

2. Add to database:
```sql
INSERT INTO job_sources (name, base_url, source_type) 
VALUES ('NewSite', 'https://newsite.com', 'job_board');
```

3. Add to scheduler:
```python
# scraper/scheduler.py
SPIDERS = ['remoteok', 'jobicy', 'arbeitnow', 'themuse', 'newsite']
```

---

## 📞 Support

- Check logs: `/tmp/backend.log`, `/tmp/frontend.log`, `/tmp/pgdata/pg.log`
- Database issues: `psql -h /tmp -U vscode -d job_ai`
- API docs: http://localhost:5000/health (basic health check)
- Analysis results: `docs/analysis/*.png`

---

## 🎯 Next Steps

1. **Set up your profile** - Add skills, experience, preferred roles
2. **Run the scraper** - Populate database with real jobs
3. **Analyze jobs** - Click "Analyze Match" to get AI scores
4. **View analytics** - Check market trends and insights
5. **Track applications** - Save jobs and manage your pipeline
6. **Run weekly analysis** - Generate insights and charts

**Happy job hunting! 🚀**
