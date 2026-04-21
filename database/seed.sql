-- Seed data for job sources

INSERT INTO job_sources (name, base_url, source_type, is_active) VALUES
('LinkedIn Jobs', 'https://www.linkedin.com/jobs', 'job_board', true),
('Indeed', 'https://www.indeed.com', 'job_board', true),
('RemoteOK', 'https://remoteok.com', 'job_board', true),
('WeWorkRemotely', 'https://weworkremotely.com', 'job_board', true),
('ResearchGate Jobs', 'https://www.researchgate.net/jobs', 'research', true),
('Nature Careers', 'https://www.nature.com/naturecareers', 'research', true),
('Academic Jobs Online', 'https://academicjobsonline.org', 'research', true),
('HigherEdJobs', 'https://www.higheredjobs.com', 'research', true);
