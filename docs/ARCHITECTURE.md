# Job-AI Platform Architecture - Complete Data Flow

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         JOB-AI PLATFORM                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   SCRAPER    │─────▶│   BACKEND    │─────▶│   FRONTEND   │
│  (Python)    │      │  (Node.js)   │      │   (React)    │
└──────┬───────┘      └──────┬───────┘      └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────────────────────────────┐
│      PostgreSQL DATABASE             │
│  (jobs, users, ai_scores, etc.)      │
└──────────────────────────────────────┘
       ▲
       │
┌──────┴───────┐
│  OLLAMA AI   │
│  (Optional)  │
└──────────────┘
```

---

## 📊 PART 1: DATA SCRAPING (How Jobs Are Collected)

### Step-by-Step Scraping Process

#### 1. **Scheduler Starts** (`scraper/scheduler.py`)
```python
# Runs every 6 hours automatically
SPIDERS = ['remoteok', 'jobicy', 'arbeitnow', 'themuse']

# High-signal sources run every cycle
# Low-signal sources run every other cycle (based on analysis)
```

**What happens:**
- Scheduler wakes up every 6 hours
- Decides which spiders to run based on priority
- Launches each spider one by one

---

#### 2. **Spider Crawls Job Board** (`scraper/job_scraper/spiders/remoteok_spider.py`)

**Example: RemoteOK Spider**

```python
class RemoteOKSpider(BaseJobSpider):
    name = 'remoteok'
    start_urls = ['https://remoteok.com/api']
    
    def parse(self, response):
        # 1. Fetch JSON data from RemoteOK API
        data = json.loads(response.text)
        
        # 2. Loop through each job
        for job in data:
            # 3. Extract job details
            yield self.create_job_item(
                external_id=job.get('id'),
                title=job.get('position'),
                company=job.get('company'),
                location=job.get('location') or 'Remote',
                work_mode='remote',
                role_type=self.classify_role(tags, title),
                salary_min=job.get('salary_min'),
                salary_max=job.get('salary_max'),
                description=job.get('description'),
                url=job.get('apply_url'),
                posted_date=job.get('date')[:10],
            )
```

**What happens:**
1. Spider makes HTTP request to RemoteOK API
2. Receives JSON with 100+ job listings
3. Parses each job and extracts fields
4. Classifies role type (DevOps, Frontend, Backend, etc.)
5. Creates JobItem for each job

---

#### 3. **Pipeline Processing** (`scraper/job_scraper/pipelines.py`)

Jobs flow through 4 pipelines in order:

##### **Pipeline 1: RoleFilterPipeline** (Priority 50)
```python
NON_TECH_ROLES = {'postdoc', 'research associate', 'phd position', ...}

def process_item(self, item, spider):
    role = item.get('role_type').lower()
    if role in NON_TECH_ROLES:
        raise Exception(f"Filtered non-tech role: {role}")
    return item
```
**Purpose:** Drop non-tech roles BEFORE they reach the backend
**Impact:** Saves ~36% of AI API calls (from analysis)

##### **Pipeline 2: CleaningPipeline** (Priority 100)
```python
def process_item(self, item, spider):
    # Remove extra whitespace
    item['title'] = self.clean_text(item['title'])
    item['company'] = self.clean_text(item['company'])
    return item
```
**Purpose:** Clean up text fields (remove extra spaces, newlines)

##### **Pipeline 3: DeduplicationPipeline** (Priority 200)
```python
def process_item(self, item, spider):
    dedup_key = f"{source_id}-{title}-{company}".lower()
    if dedup_key in self.seen:
        raise Exception(f"Duplicate: {dedup_key}")
    self.seen.add(dedup_key)
    return item
```
**Purpose:** Skip duplicate jobs within the same scraping session

##### **Pipeline 4: BackendPipeline** (Priority 300)
```python
def process_item(self, item, spider):
    self.jobs_buffer.append(dict(item))
    
    if len(self.jobs_buffer) >= 10:  # Batch size
        self.send_to_backend()
    return item

def send_to_backend(self):
    response = requests.post(
        'http://localhost:5000/api/jobs/ingest',
        json={'jobs': self.jobs_buffer}
    )
```
**Purpose:** Send jobs to backend API in batches of 10

---

## 🔧 PART 2: BACKEND API (How Data Is Processed)

### Backend Receives Jobs (`backend/src/routes/jobs.ts`)

#### **Endpoint: POST /api/jobs/ingest**

```typescript
router.post('/ingest', async (req, res) => {
  const jobs = req.body.jobs;  // Array of 10 jobs from scraper
  
  const inserted = [];
  for (const job of jobs) {
    // 1. Create deduplication key
    const dedup_key = `${job.source_id}-${job.title}-${job.company}`.toLowerCase();
    
    // 2. Insert into database (skip if duplicate)
    const result = await query(
      `INSERT INTO jobs (source_id, external_id, title, company, location, 
       work_mode, role_type, employment_type, salary_min, salary_max, 
       description, requirements, url, posted_date, dedup_key, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (dedup_key) DO NOTHING 
       RETURNING id`,
      [job.source_id, job.external_id, job.title, ...]
    );
    
    if (result.rows.length > 0) {
      inserted.push(result.rows[0].id);
    }
  }
  
  res.json({ inserted: inserted.length, job_ids: inserted });
});
```

**What happens:**
1. Backend receives batch of 10 jobs
2. For each job:
   - Creates unique dedup_key
   - Tries to INSERT into database
   - If duplicate exists (same dedup_key), skips it
   - If new, inserts and returns job ID
3. Responds with count of inserted jobs

---

## 🗄️ PART 3: DATABASE (How Data Is Stored)

### PostgreSQL Schema (`database/schema.sql`)

#### **Main Tables:**

##### **1. job_sources** (Job board metadata)
```sql
CREATE TABLE job_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),              -- 'LinkedIn', 'RemoteOK', etc.
    base_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    scrape_frequency_hours INTEGER DEFAULT 24,
    last_scraped_at TIMESTAMP
);
```
**Contains:** 8 job sources (LinkedIn, Indeed, RemoteOK, etc.)

##### **2. jobs** (All scraped jobs)
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES job_sources(id),
    external_id VARCHAR(500),       -- Job ID from source site
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    work_mode VARCHAR(50),          -- 'remote', 'hybrid', 'onsite'
    role_type VARCHAR(100),         -- 'DevOps', 'Frontend', etc.
    employment_type VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT,
    url VARCHAR(1000),
    posted_date DATE,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dedup_key VARCHAR(500) UNIQUE,  -- Prevents duplicates
    raw_data JSONB,
    is_active BOOLEAN DEFAULT true
);
```
**Contains:** All scraped jobs (currently 0, will grow when you run scraper)

##### **3. users** (User accounts)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **4. profiles** (User preferences)
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    resume_text TEXT,
    skills JSONB DEFAULT '[]',           -- ['Python', 'Docker', 'AWS']
    experience_years INTEGER,
    preferred_roles JSONB DEFAULT '[]',  -- ['DevOps', 'SRE']
    preferred_locations JSONB DEFAULT '[]',
    min_salary INTEGER,
    telegram_chat_id VARCHAR(255),
    email_notifications BOOLEAN DEFAULT true
);
```

##### **5. ai_scores** (AI job matching results)
```sql
CREATE TABLE ai_scores (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    user_id INTEGER REFERENCES users(id),
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    role_classification VARCHAR(100),
    extracted_skills JSONB DEFAULT '[]',
    missing_skills JSONB DEFAULT '[]',
    summary TEXT,
    reasoning TEXT,
    should_alert BOOLEAN DEFAULT false,
    ai_model VARCHAR(100),
    UNIQUE(job_id, user_id)  -- One score per user per job
);
```

##### **6. applications** (User's job applications)
```sql
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    status VARCHAR(100) DEFAULT 'applied',  -- 'applied', 'interview', 'offer', 'rejected'
    applied_date DATE,
    notes TEXT
);
```

##### **7. alerts** (Notifications sent to users)
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    ai_score_id INTEGER REFERENCES ai_scores(id),
    alert_type VARCHAR(50),
    sent_via VARCHAR(50),  -- 'email', 'telegram'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false
);
```

---

## 🔄 COMPLETE DATA FLOW EXAMPLE

### Scenario: User searches for DevOps jobs

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: SCRAPING (Runs every 6 hours automatically)            │
└─────────────────────────────────────────────────────────────────┘

1. Scheduler starts RemoteOK spider
2. Spider fetches https://remoteok.com/api
3. Receives 150 jobs in JSON format
4. For each job:
   ├─ RoleFilterPipeline: Check if tech role
   │  ├─ "DevOps Engineer" → ✅ PASS
   │  └─ "Postdoc Researcher" → ❌ FILTERED (saves AI cost)
   ├─ CleaningPipeline: Clean text
   ├─ DeduplicationPipeline: Check if seen before
   └─ BackendPipeline: Send to backend in batches of 10

5. Backend receives: POST /api/jobs/ingest
   {
     "jobs": [
       {
         "source_id": 3,
         "title": "Senior DevOps Engineer",
         "company": "Acme Corp",
         "location": "Remote",
         "work_mode": "remote",
         "role_type": "DevOps",
         "salary_min": 120000,
         "salary_max": 180000,
         "description": "We're looking for...",
         "url": "https://remoteok.com/job/12345"
       },
       ... 9 more jobs
     ]
   }

6. Backend inserts into PostgreSQL:
   INSERT INTO jobs (...) VALUES (...) ON CONFLICT (dedup_key) DO NOTHING

7. Database now has 10 new jobs (or fewer if duplicates)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: USER SEARCHES (Frontend → Backend → Database)          │
└─────────────────────────────────────────────────────────────────┘

1. User opens http://localhost:3000
2. User types "DevOps" in search box
3. Frontend sends: GET /api/jobs/search?keyword=devops&limit=20

4. Backend queries database:
   SELECT j.*, ai.match_score, ai.summary
   FROM jobs j
   LEFT JOIN ai_scores ai ON j.id = ai.job_id AND ai.user_id = $1
   WHERE to_tsvector('english', j.title || ' ' || j.description)
         @@ plainto_tsquery('english', 'devops')
   ORDER BY j.posted_date DESC
   LIMIT 20

5. Database returns 20 matching jobs

6. Backend sends JSON to frontend:
   {
     "jobs": [
       {
         "id": 1,
         "title": "Senior DevOps Engineer",
         "company": "Acme Corp",
         "location": "Remote",
         "match_score": null,  // Not analyzed yet
         "summary": null
       },
       ...
     ],
     "total": 45
   }

7. Frontend displays job cards

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: AI MATCHING (User clicks "Analyze Match")              │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Analyze Match" on job #1
2. Frontend sends: POST /api/jobs/1/analyze

3. Backend:
   a) Fetches job from database:
      SELECT * FROM jobs WHERE id = 1
   
   b) Fetches user profile:
      SELECT * FROM profiles WHERE user_id = $1
   
   c) Calls AI service (ai.service.ts):
      const analysis = await analyzeJobMatch(job, profile)
   
   d) AI service sends to Ollama:
      POST http://localhost:11434/api/generate
      {
        "model": "gemma:2b",
        "prompt": "Analyze this job against user profile...",
        "format": "json"
      }
   
   e) Ollama returns:
      {
        "role_classification": "DevOps Engineer",
        "match_score": 85,
        "extracted_skills": ["Docker", "Kubernetes", "AWS", "Terraform"],
        "missing_skills": ["Ansible", "Prometheus"],
        "summary": "Strong match! You have 80% of required skills.",
        "reasoning": "Your 5 years of DevOps experience aligns well...",
        "should_alert": true
      }
   
   f) Backend saves to database:
      INSERT INTO ai_scores (job_id, user_id, match_score, ...)
      VALUES (1, 123, 85, ...)
   
   g) If should_alert = true:
      - Send email notification
      - Send Telegram message (if configured)
      - INSERT INTO alerts (...)

4. Frontend displays match score: 85% with reasoning

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: USER APPLIES (Tracking application)                    │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Save Job"
2. Frontend sends: POST /api/applications/saved
   { "job_id": 1, "notes": "Great fit!" }

3. Backend inserts:
   INSERT INTO saved_jobs (user_id, job_id, notes)
   VALUES (123, 1, 'Great fit!')

4. Later, user marks as applied:
   POST /api/applications
   {
     "job_id": 1,
     "status": "applied",
     "applied_date": "2024-01-15"
   }

5. Backend inserts:
   INSERT INTO applications (user_id, job_id, status, applied_date)
   VALUES (123, 1, 'applied', '2024-01-15')

6. User can track status: applied → screening → interview → offer

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: ANALYTICS (Weekly analysis)                            │
└─────────────────────────────────────────────────────────────────┘

1. Every Monday, scheduler runs:
   python3 docs/analysis/job_analysis.py

2. Script queries database:
   - Export jobs to DataFrame
   - Export ai_scores to DataFrame
   - Merge and analyze

3. Generates insights:
   - Which sources have highest match rates?
   - What skills are most in-demand?
   - Salary trends by role
   - Match score distributions

4. Saves 6 charts to docs/analysis/*.png

5. Frontend displays in /analytics dashboard
```

---

## 🔍 DATABASE QUERIES IN ACTION

### Query 1: Get all DevOps jobs posted in last 7 days
```sql
SELECT 
    j.id,
    j.title,
    j.company,
    j.location,
    j.salary_min,
    j.salary_max,
    js.name as source_name
FROM jobs j
JOIN job_sources js ON j.source_id = js.id
WHERE j.role_type = 'DevOps'
  AND j.posted_date >= CURRENT_DATE - INTERVAL '7 days'
  AND j.is_active = true
ORDER BY j.posted_date DESC;
```

### Query 2: Get user's high-match jobs (≥75%)
```sql
SELECT 
    j.title,
    j.company,
    ai.match_score,
    ai.summary
FROM jobs j
JOIN ai_scores ai ON j.id = ai.job_id
WHERE ai.user_id = 123
  AND ai.match_score >= 75
ORDER BY ai.match_score DESC;
```

### Query 3: Analytics - Top skills in demand
```sql
SELECT 
    js.skill_name,
    COUNT(*) as job_count
FROM job_skills js
JOIN jobs j ON js.job_id = j.id
WHERE j.is_active = true
  AND j.posted_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY js.skill_name
ORDER BY job_count DESC
LIMIT 15;
```

---

## 🚀 HOW TO RUN EVERYTHING

### 1. Start Database (Already Running)
```bash
pg_ctl -D /tmp/pgdata status
# ✅ Running
```

### 2. Start Backend (Already Running)
```bash
cd /workspaces/job-ai/backend
npm run dev
# ✅ Running on http://localhost:5000
```

### 3. Start Frontend (Already Running)
```bash
cd /workspaces/job-ai/frontend
npm run dev
# ✅ Running on http://localhost:3000
```

### 4. Run Scraper (Populate Database)
```bash
cd /workspaces/job-ai/scraper

# Scrape RemoteOK (adds ~100 jobs)
python3 -m scrapy crawl remoteok

# Check database
psql -h /tmp -U vscode -d job_ai -c "SELECT COUNT(*) FROM jobs;"
```

### 5. Test the Flow
```bash
# 1. Check scraped jobs
psql -h /tmp -U vscode -d job_ai -c "
  SELECT id, title, company, role_type 
  FROM jobs 
  LIMIT 5;
"

# 2. Register a user (via frontend or curl)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# 3. Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
# Returns: {"user": {...}, "token": "eyJhbGc..."}

# 4. Search jobs with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/jobs/search?keyword=devops&limit=5"

# 5. Analyze a job
curl -X POST http://localhost:5000/api/jobs/1/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 DATA FLOW SUMMARY

```
SCRAPER → BACKEND → DATABASE → BACKEND → FRONTEND → USER
   ↓         ↓         ↓          ↑         ↑
   │         │         │          │         │
   │         │         └──────────┘         │
   │         │         (Queries)            │
   │         │                              │
   │         └──────────────────────────────┘
   │         (API Responses)
   │
   └─────────────────────────────────────────
   (Batch inserts every 10 jobs)
```

**Key Points:**
1. Scraper runs independently, pushes data to backend
2. Backend is the single source of truth for database access
3. Frontend never talks to database directly
4. All data flows through REST API
5. AI scoring happens on-demand when user clicks "Analyze"
6. Analysis script reads database directly for reporting

---

## 🎯 NEXT STEPS

1. **Run the scraper** to populate database with real jobs
2. **Register a user** via frontend
3. **Search for jobs** matching your skills
4. **Analyze matches** to get AI scores
5. **Track applications** as you apply
6. **View analytics** to see market trends

Check status anytime: `bash /workspaces/job-ai/status.sh`
