export interface User {
  id: number;
  email: string;
  full_name?: string;
  created_at: Date;
}

export interface Profile {
  id: number;
  user_id: number;
  resume_text?: string;
  skills: string[];
  experience_years?: number;
  education_level?: string;
  preferred_roles: string[];
  preferred_locations: string[];
  preferred_work_modes: string[];
  min_salary?: number;
  telegram_chat_id?: string;
  email_notifications: boolean;
  telegram_notifications: boolean;
}

export interface Job {
  id: number;
  source_id: number;
  external_id?: string;
  title: string;
  company?: string;
  location?: string;
  work_mode?: string;
  role_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  description?: string;
  requirements?: string;
  url?: string;
  posted_date?: Date;
  scraped_at: Date;
  is_active: boolean;
}

export interface AIScore {
  id: number;
  job_id: number;
  user_id: number;
  match_score: number;
  role_classification?: string;
  extracted_skills: string[];
  missing_skills: string[];
  summary?: string;
  reasoning?: string;
  should_alert: boolean;
  ai_model?: string;
  created_at: Date;
}

export interface AIAnalysisResult {
  role_classification: string;
  match_score: number;
  extracted_skills: string[];
  missing_skills: string[];
  summary: string;
  reasoning: string;
  should_alert: boolean;
}

export interface Application {
  id: number;
  user_id: number;
  job_id: number;
  status: string;
  applied_date?: Date;
  resume_version?: string;
  cover_letter?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Alert {
  id: number;
  user_id: number;
  job_id: number;
  ai_score_id: number;
  alert_type: string;
  sent_via: string;
  sent_at: Date;
  is_read: boolean;
}

export interface JobSource {
  id: number;
  name: string;
  base_url: string;
  source_type?: string;
  is_active: boolean;
  scrape_frequency_hours: number;
  last_scraped_at?: Date;
}
