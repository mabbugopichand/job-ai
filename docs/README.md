# 📚 Job-AI Platform - Documentation Index

## 🚀 Quick Start

**Check System Status:**
```bash
bash /workspaces/job-ai/status.sh
```

**Current Status:**
- ✅ PostgreSQL: Running with 8 job sources
- ✅ Backend API: http://localhost:5000
- ✅ Frontend: http://localhost:3000
- ✅ Data Analysis: 6 charts generated
- ⏳ Scraper: Ready (needs pip install)

---

## 📖 Documentation Files

### 1. **Setup & Installation**
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
  - Prerequisites
  - Installation steps
  - Configuration
  - Troubleshooting
  - Running the application

### 2. **Architecture & Data Flow**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
  - System overview
  - Data scraping process
  - Backend API design
  - Database schema
  - Complete data flow examples

### 3. **Visual Guides**
- **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** - Simple visual explanations
  - How everything works (diagrams)
  - User journey examples
  - Component responsibilities
  - Quick reference

### 4. **AI System**
- **[AI_GUIDE.md](AI_GUIDE.md)** - Complete AI documentation
  - How AI matching works
  - Prompt engineering
  - Scoring algorithm
  - Cost optimization
  - Testing AI
  - Configuration options

- **[AI_FLOW_DIAGRAM.txt](AI_FLOW_DIAGRAM.txt)** - ASCII flow diagram
  - Step-by-step AI process
  - Visual representation

- **[../AI_SUMMARY.txt](../AI_SUMMARY.txt)** - Quick AI reference
  - What AI does
  - How it works
  - Key features
  - Setup steps

### 5. **Data Analysis**
- **[analysis/job_analysis.py](analysis/job_analysis.py)** - Analysis script
  - Generates 6 charts
  - Statistical analysis
  - Insights & recommendations
  - Executive summary

- **Generated Charts:**
  - `chart1_match_by_source.png` - Match scores by job source
  - `chart2_weekly_trend.png` - Weekly posting trends
  - `chart3_boxplot_roles.png` - Score distribution by role
  - `chart4_correlation_heatmap.png` - Feature correlations
  - `chart5_clusters.png` - Job clusters (salary vs score)
  - `chart6_alert_by_workmode.png` - Alert rates by work mode

---

## 🎯 Quick Navigation

### For First-Time Users
1. Read: [VISUAL_GUIDE.md](VISUAL_GUIDE.md) - Understand the system
2. Read: [SETUP_GUIDE.md](SETUP_GUIDE.md) - Set up your environment
3. Run: `bash status.sh` - Check everything is working
4. Open: http://localhost:3000 - Start using the app

### For Developers
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the codebase
2. Read: [AI_GUIDE.md](AI_GUIDE.md) - Understand AI integration
3. Check: Database schema in `../database/schema.sql`
4. Review: API routes in `../backend/src/routes/`

### For Data Analysts
1. Run: `python3 docs/analysis/job_analysis.py`
2. View: Generated charts in `docs/analysis/*.png`
3. Read: Analysis insights in script output
4. Customize: Modify `job_analysis.py` for custom reports

### For DevOps Engineers
1. Check: `../docker-compose.yml` - Container setup
2. Review: `../scraper/scheduler.py` - Automated scraping
3. Monitor: Logs in `/tmp/*.log`
4. Scale: Adjust scraper frequency and sources

---

## 📊 Key Insights from Analysis

### Performance Metrics
- **Total Jobs Analyzed**: 800
- **High-Match Rate**: 19.2% (score ≥ 75)
- **Average Match Score**: 57.9/100
- **Tech Role Avg**: 65.0
- **Non-Tech Role Avg**: 45.1

### Optimization Implemented
1. ✅ **Role filtering** - Saves 36% of AI API calls
2. ✅ **Source prioritization** - High-signal sources run more often
3. ✅ **Smart scheduling** - Low-signal sources run every other cycle
4. ✅ **Result caching** - Instant re-analysis

### Top Findings
- Tech roles score **20 points higher** than non-tech (p<0.001)
- **Nature Careers** has highest avg score (58.9)
- **WeWorkRemotely** has lowest alert rate (16.5%)
- **Salary doesn't correlate** with match score (r=-0.015)
- **Role type is the only significant predictor** of match quality

---

## 🔧 Common Tasks

### Start Everything
```bash
bash /workspaces/job-ai/start.sh
```

### Check Status
```bash
bash /workspaces/job-ai/status.sh
```

### Run Scraper
```bash
cd /workspaces/job-ai/scraper
pip install --break-system-packages -r requirements.txt
python3 -m scrapy crawl remoteok
```

### Run Analysis
```bash
cd /workspaces/job-ai
python3 docs/analysis/job_analysis.py
```

### Check Database
```bash
psql -h /tmp -U vscode -d job_ai
```

### View Logs
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log

# Database
tail -f /tmp/pgdata/pg.log
```

---

## 🗂️ Project Structure

```
job-ai/
├── docs/                          # 📚 All documentation
│   ├── README.md                  # This file
│   ├── SETUP_GUIDE.md             # Setup instructions
│   ├── ARCHITECTURE.md            # Technical architecture
│   ├── VISUAL_GUIDE.md            # Visual explanations
│   ├── AI_GUIDE.md                # AI documentation
│   ├── AI_FLOW_DIAGRAM.txt        # AI flow diagram
│   └── analysis/                  # Data analysis
│       ├── job_analysis.py        # Analysis script
│       └── *.png                  # Generated charts
│
├── backend/                       # Node.js API
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   ├── services/              # AI, notifications
│   │   ├── db/                    # Database connection
│   │   └── middleware/            # Auth, validation
│   └── .env                       # Configuration
│
├── frontend/                      # React app
│   └── src/
│       ├── components/            # UI components
│       ├── services/              # API client
│       └── types/                 # TypeScript types
│
├── scraper/                       # Python scraper
│   ├── job_scraper/
│   │   ├── spiders/               # Job board spiders
│   │   ├── pipelines.py           # Data processing
│   │   └── settings.py            # Configuration
│   └── scheduler.py               # Automated scraping
│
├── database/                      # PostgreSQL
│   ├── schema.sql                 # Database schema
│   └── seed.sql                   # Initial data
│
├── ai/                            # AI prompts
│   └── prompts/
│       └── job_analysis.json      # Prompt template
│
├── status.sh                      # Status check script
├── start.sh                       # Start all services
└── AI_SUMMARY.txt                 # Quick AI reference
```

---

## 🆘 Getting Help

### Documentation
- Read the relevant guide above
- Check troubleshooting sections
- Review code comments

### Debugging
```bash
# Check status
bash status.sh

# View logs
tail -f /tmp/backend.log
tail -f /tmp/frontend.log

# Test backend
curl http://localhost:5000/health

# Test database
psql -h /tmp -U vscode -d job_ai -c "SELECT COUNT(*) FROM jobs;"
```

### Common Issues

**Backend not starting:**
- Check logs: `tail -f /tmp/backend.log`
- Verify database: `pg_ctl -D /tmp/pgdata status`
- Check port: `lsof -i :5000`

**Frontend not loading:**
- Check logs: `tail -f /tmp/frontend.log`
- Verify backend: `curl http://localhost:5000/health`
- Check port: `lsof -i :3000`

**Scraper errors:**
- Install dependencies: `pip install --break-system-packages -r requirements.txt`
- Check backend: `curl http://localhost:5000/health`
- Test spider: `scrapy crawl remoteok -L DEBUG`

**AI not working:**
- Install Ollama: https://ollama.ai
- Pull model: `ollama pull gemma:2b`
- Test: `curl http://localhost:11434/api/tags`

---

## 🎉 You're Ready!

Everything is documented and ready to use. Start with:

1. **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** - Understand the system
2. **Run the scraper** - Populate database with jobs
3. **Open frontend** - http://localhost:3000
4. **Start searching!** - Find your dream job

**Happy job hunting! 🚀**
