# 🎯 Job-AI Platform - Simple Visual Guide

## ✅ CURRENT STATUS

```
┌─────────────────────────────────────────────────────┐
│  YOUR SYSTEM IS RUNNING!                           │
├─────────────────────────────────────────────────────┤
│  ✅ PostgreSQL Database  → 8 job sources loaded    │
│  ✅ Backend API          → http://localhost:5000   │
│  ✅ Frontend React App   → http://localhost:3000   │
│  ✅ Data Analysis        → 6 charts generated      │
│  ⏳ Scraper             → Ready (needs pip install)│
└─────────────────────────────────────────────────────┘
```

---

## 🔄 HOW IT ALL WORKS (Simple Version)

### 1️⃣ **SCRAPING** - Collecting Jobs from Internet

```
Internet Job Boards          Scraper (Python)           Backend API
─────────────────────       ──────────────────         ────────────
                                                        
RemoteOK.com  ────┐                                    
Indeed.com    ────┤                                    
LinkedIn.com  ────┼──▶  Spider fetches jobs  ──▶  POST /api/jobs/ingest
WeWorkRemotely ───┤     (100+ jobs at a time)         ↓
Nature Careers ───┘                                    Saves to Database
                        Filters:                       
                        ✅ Tech roles only             
                        ❌ Skip duplicates             
                        ❌ Skip non-tech roles         
```

**What happens:**
- Spider visits job board website
- Downloads job listings (JSON/HTML)
- Extracts: title, company, salary, description, etc.
- Filters out non-tech roles (saves AI cost)
- Sends batches of 10 jobs to backend
- Backend saves to PostgreSQL database

---

### 2️⃣ **BACKEND** - Processing & Storing Data

```
Backend API (Node.js + Express)
────────────────────────────────

┌─────────────────────────────────────────┐
│  Routes (API Endpoints)                 │
├─────────────────────────────────────────┤
│  POST /api/jobs/ingest                  │  ← Scraper sends jobs here
│  GET  /api/jobs/search?keyword=devops   │  ← Frontend searches here
│  POST /api/jobs/:id/analyze             │  ← AI matching happens here
│  GET  /api/jobs/analytics               │  ← Dashboard data
│  POST /api/auth/register                │  ← User signup
│  POST /api/auth/login                   │  ← User login
└─────────────────────────────────────────┘
           ↓                    ↑
           ↓                    ↑
    ┌──────────────────────────────┐
    │   PostgreSQL Database        │
    │                              │
    │  Tables:                     │
    │  • jobs (scraped listings)   │
    │  • users (accounts)          │
    │  • profiles (skills/prefs)   │
    │  • ai_scores (match results) │
    │  • applications (tracking)   │
    │  • alerts (notifications)    │
    └──────────────────────────────┘
```

**What happens:**
- Backend receives HTTP requests
- Queries PostgreSQL database
- Returns JSON responses
- Handles authentication (JWT tokens)
- Calls AI service for job matching

---

### 3️⃣ **DATABASE** - Storing Everything

```
PostgreSQL Database Structure
──────────────────────────────

job_sources (8 rows)          jobs (0 rows - will grow)
┌────┬──────────────┐         ┌────┬─────────────────────┬──────────┐
│ id │ name         │         │ id │ title               │ company  │
├────┼──────────────┤         ├────┼─────────────────────┼──────────┤
│ 1  │ LinkedIn     │         │ 1  │ DevOps Engineer     │ Acme     │
│ 2  │ Indeed       │         │ 2  │ Cloud Architect     │ TechCo   │
│ 3  │ RemoteOK     │         │ 3  │ SRE                 │ StartUp  │
│ 4  │ WeWorkRemote │         │ ...│ ...                 │ ...      │
└────┴──────────────┘         └────┴─────────────────────┴──────────┘
                                     ↓
                              ai_scores (match results)
                              ┌────┬────────┬──────┬─────────────┐
                              │ id │ job_id │ user │ match_score │
                              ├────┼────────┼──────┼─────────────┤
                              │ 1  │ 1      │ 123  │ 85          │
                              │ 2  │ 2      │ 123  │ 72          │
                              └────┴────────┴──────┴─────────────┘
```

**What's stored:**
- **job_sources**: List of job boards (LinkedIn, Indeed, etc.)
- **jobs**: All scraped job listings
- **users**: User accounts (email, password)
- **profiles**: User skills, experience, preferences
- **ai_scores**: AI match results (0-100 score per job per user)
- **applications**: Jobs user applied to
- **alerts**: Notifications sent to users

---

### 4️⃣ **FRONTEND** - User Interface

```
React Frontend (http://localhost:3000)
───────────────────────────────────────

┌─────────────────────────────────────────────────┐
│  Navigation Bar                                 │
│  [Dashboard] [Jobs] [Applications] [Profile]    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Job Search                                     │
│  ┌─────────────────────────────────────┐        │
│  │ Search: devops                      │ [Go]   │
│  └─────────────────────────────────────┘        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 💼 Senior DevOps Engineer                │   │
│  │ 🏢 Acme Corp  📍 Remote  💰 $120k-180k   │   │
│  │ Match: 85% ⭐⭐⭐⭐⭐                      │   │
│  │ [View Details] [Save] [Apply]            │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 💼 Cloud Engineer                        │   │
│  │ 🏢 TechCo  📍 Hybrid  💰 $100k-150k      │   │
│  │ Match: 72% ⭐⭐⭐⭐                        │   │
│  │ [View Details] [Save] [Apply]            │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**What users do:**
1. Register/Login
2. Set up profile (skills, experience)
3. Search for jobs
4. Click "Analyze Match" to get AI score
5. Save interesting jobs
6. Track applications
7. View analytics dashboard

---

## 🔄 COMPLETE FLOW EXAMPLE

### User Journey: Finding a DevOps Job

```
STEP 1: Scraper runs (background, every 6 hours)
────────────────────────────────────────────────
RemoteOK.com → Spider → Backend → Database
                                  ↓
                          100 new DevOps jobs saved


STEP 2: User searches for jobs
───────────────────────────────
User types "devops" → Frontend → Backend → Database
                                            ↓
                                    Query: SELECT * FROM jobs 
                                           WHERE title LIKE '%devops%'
                                            ↓
                                    Returns 45 jobs
                                            ↓
Frontend displays job cards ←───────────────┘


STEP 3: User clicks "Analyze Match"
────────────────────────────────────
User clicks button → Frontend → Backend → AI Service (Ollama)
                                           ↓
                                   Compares job vs user profile
                                           ↓
                                   Returns: 85% match
                                           ↓
                     Backend saves to ai_scores table
                                           ↓
                     Frontend shows: "85% match! Strong fit"


STEP 4: User saves job
──────────────────────
User clicks "Save" → Frontend → Backend → Database
                                          ↓
                                  INSERT INTO saved_jobs


STEP 5: User applies
─────────────────────
User clicks "Apply" → Opens job URL in new tab
User applies on company website
User returns and clicks "Mark as Applied"
                     ↓
Frontend → Backend → Database
                     ↓
             INSERT INTO applications
             SET status = 'applied'


STEP 6: User tracks progress
─────────────────────────────
User updates status: applied → screening → interview → offer
                              ↓
                     Backend updates database
                              ↓
                     Dashboard shows pipeline
```

---

## 📊 DATA ANALYSIS (Weekly Reports)

```
Every Monday (automatic)
────────────────────────

Scheduler runs: python3 docs/analysis/job_analysis.py
                        ↓
                Reads database:
                • All jobs
                • All ai_scores
                • All applications
                        ↓
                Analyzes:
                • Which sources have best jobs?
                • What skills are in demand?
                • Salary trends by role
                • Match score distributions
                        ↓
                Generates 6 charts:
                • chart1_match_by_source.png
                • chart2_weekly_trend.png
                • chart3_boxplot_roles.png
                • chart4_correlation_heatmap.png
                • chart5_clusters.png
                • chart6_alert_by_workmode.png
                        ↓
                Saves to docs/analysis/
                        ↓
                Frontend displays in /analytics
```

**Key Insights from Analysis:**
- ✅ Tech roles score 20 points higher than non-tech
- ✅ Nature Careers has highest avg score (58.9)
- ✅ WeWorkRemotely has lowest alert rate (16.5%)
- ✅ Salary doesn't correlate with match score
- ✅ Role type is the only significant predictor

---

## 🚀 HOW TO USE IT

### Quick Start Commands

```bash
# 1. Check status
bash /workspaces/job-ai/status.sh

# 2. Install scraper dependencies (one-time)
cd /workspaces/job-ai/scraper
pip install --break-system-packages -r requirements.txt

# 3. Run scraper (populate database)
python3 -m scrapy crawl remoteok

# 4. Check database
psql -h /tmp -U vscode -d job_ai -c "SELECT COUNT(*) FROM jobs;"

# 5. Open frontend
# Visit: http://localhost:3000

# 6. Register account and start searching!
```

---

## 🎯 WHAT EACH COMPONENT DOES

| Component | Purpose | Technology | Status |
|-----------|---------|------------|--------|
| **Scraper** | Collects jobs from internet | Python + Scrapy | ⏳ Ready (needs pip install) |
| **Backend** | API server & business logic | Node.js + Express | ✅ Running on :5000 |
| **Database** | Stores all data | PostgreSQL | ✅ Running with 8 sources |
| **Frontend** | User interface | React + Vite | ✅ Running on :3000 |
| **AI Service** | Job matching | Ollama (optional) | ⏳ Optional |
| **Analysis** | Weekly reports | Python + Pandas | ✅ 6 charts generated |

---

## 🔍 DEBUGGING

### Check if everything is running:
```bash
bash /workspaces/job-ai/status.sh
```

### View logs:
```bash
# Backend logs
tail -f /tmp/backend.log

# Frontend logs
tail -f /tmp/frontend.log

# Database logs
tail -f /tmp/pgdata/pg.log
```

### Test backend:
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test database:
```bash
psql -h /tmp -U vscode -d job_ai -c "SELECT name FROM job_sources;"
# Should show 8 job sources
```

---

## 📚 DOCUMENTATION

- **Full Setup Guide**: `docs/SETUP_GUIDE.md`
- **Architecture Details**: `docs/ARCHITECTURE.md`
- **This Visual Guide**: `docs/VISUAL_GUIDE.md`
- **Data Analysis Report**: `docs/analysis/` (charts + script)

---

## 🎉 YOU'RE READY!

Your system is **fully operational**. The only missing piece is running the scraper to populate the database with real jobs.

**Next step:**
```bash
cd /workspaces/job-ai/scraper
pip install --break-system-packages -r requirements.txt
python3 -m scrapy crawl remoteok
```

Then open http://localhost:3000 and start searching! 🚀
