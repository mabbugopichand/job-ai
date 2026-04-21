-- AI Career Intelligence Platform Database Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    resume_text TEXT,
    skills JSONB DEFAULT '[]',
    experience_years INTEGER,
    education_level VARCHAR(100),
    preferred_roles JSONB DEFAULT '[]',
    preferred_locations JSONB DEFAULT '[]',
    preferred_work_modes JSONB DEFAULT '[]',
    min_salary INTEGER,
    telegram_chat_id VARCHAR(255),
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE job_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    source_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    scrape_frequency_hours INTEGER DEFAULT 24,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES job_sources(id),
    external_id VARCHAR(500),
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    work_mode VARCHAR(50),
    role_type VARCHAR(100),
    employment_type VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10),
    description TEXT,
    requirements TEXT,
    url VARCHAR(1000),
    posted_date DATE,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dedup_key VARCHAR(500) UNIQUE,
    raw_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, external_id)
);

CREATE TABLE job_skills (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_scores (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    role_classification VARCHAR(100),
    extracted_skills JSONB DEFAULT '[]',
    missing_skills JSONB DEFAULT '[]',
    summary TEXT,
    reasoning TEXT,
    should_alert BOOLEAN DEFAULT false,
    ai_model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    ai_score_id INTEGER REFERENCES ai_scores(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),
    sent_via VARCHAR(50),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(100) DEFAULT 'applied',
    applied_date DATE,
    resume_version TEXT,
    cover_letter TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE followups (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    followup_date DATE,
    followup_type VARCHAR(100),
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_tracks (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    research_area VARCHAR(255),
    institution VARCHAR(255),
    principal_investigator VARCHAR(255),
    funding_source VARCHAR(255),
    duration_months INTEGER,
    degree_requirement VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_role_type ON jobs(role_type);
CREATE INDEX idx_jobs_work_mode ON jobs(work_mode);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_ai_scores_match_score ON ai_scores(match_score);
CREATE INDEX idx_ai_scores_user_job ON ai_scores(user_id, job_id);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_alerts_user_read ON alerts(user_id, is_read);
