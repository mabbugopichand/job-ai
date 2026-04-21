import json
from job_scraper.spiders.base_spider import BaseJobSpider

class ArbeitnowSpider(BaseJobSpider):
    name = 'arbeitnow'
    allowed_domains = ['arbeitnow.com']
    start_urls = ['https://www.arbeitnow.com/api/job-board-api']

    custom_settings = {'DOWNLOAD_DELAY': 2}

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=10, *args, **kwargs)

    def parse(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        for job in data.get('data', []):
            tags = job.get('tags', []) or []
            yield self.create_job_item(
                external_id=str(job.get('slug', '')),
                title=job.get('title', '').strip(),
                company=job.get('company_name', '').strip(),
                location=job.get('location', 'Remote'),
                work_mode='remote' if job.get('remote') else 'onsite',
                role_type=self.classify_role(tags, job.get('title', '')),
                employment_type='full-time',
                salary_min=None,
                salary_max=None,
                salary_currency='USD',
                description=job.get('description', ''),
                requirements=', '.join(tags),
                url=job.get('url', ''),
                posted_date=str(job.get('created_at', ''))[:10] if job.get('created_at') else None,
                raw_data={'source': 'arbeitnow', 'tags': tags},
            )

    def classify_role(self, tags, title):
        text = title.lower() + ' ' + ' '.join(t.lower() for t in tags)
        if any(k in text for k in ['machine learning', 'ml', 'ai', 'deep learning']):
            return 'AI/ML'
        if any(k in text for k in ['data science', 'data analyst']):
            return 'Data Science'
        if any(k in text for k in ['devops', 'sre', 'kubernetes', 'docker', 'infrastructure']):
            return 'DevOps'
        if any(k in text for k in ['frontend', 'react', 'vue', 'angular']):
            return 'Frontend'
        if any(k in text for k in ['backend', 'django', 'rails', 'node', 'java', 'python']):
            return 'Backend'
        if any(k in text for k in ['full stack', 'fullstack']):
            return 'Full Stack'
        if any(k in text for k in ['design', 'ux', 'ui']):
            return 'Design'
        if any(k in text for k in ['marketing', 'growth', 'seo']):
            return 'Marketing'
        if any(k in text for k in ['product manager', 'product owner']):
            return 'Product'
        return 'Software Engineering'
