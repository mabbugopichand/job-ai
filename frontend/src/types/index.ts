export interface User {
  id: number;
  email: string;
  full_name?: string;
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
  posted_date?: string;
  match_score?: number;
  summary?: string;
  reasoning?: string;
  extracted_skills?: string[];
  missing_skills?: string[];
}

export interface Application {
  id: number;
  job_id: number;
  status: string;
  applied_date?: string;
  notes?: string;
  title?: string;
  company?: string;
  location?: string;
  url?: string;
}

export interface Alert {
  id: number;
  job_id: number;
  title: string;
  company: string;
  match_score: number;
  summary: string;
  sent_at: string;
  is_read: boolean;
}

export interface Stats {
  total_jobs: number;
  total_users: number;
  total_applications: number;
  unread_alerts: number;
}
