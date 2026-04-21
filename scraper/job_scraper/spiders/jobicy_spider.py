import json
from job_scraper.spiders.base_spider import BaseJobSpider

class JobicySpider(BaseJobSpider):
    name = 'jobicy'
    allowed_domains = ['jobicy.com']
    start_urls = ['https://jobicy.com/api/v2/remote-jobs?count=50']

    custom_settings = {'DOWNLOAD_DELAY': 2}

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=9, *args, **kwargs)

    def parse(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        for job in data.get('jobs', []):
            tags = job.get('jobIndustry', []) or []
            if isinstance(tags, str):
                tags = [tags]
            yield self.create_job_item(
                external_id=str(job.get('id', '')),
                title=job.get('jobTitle', '').strip(),
                company=job.get('companyName', '').strip(),
                location=job.get('jobGeo', 'Remote'),
                work_mode='remote',
                role_type=self.classify_role(tags, job.get('jobTitle', '')),
                employment_type=job.get('jobType', 'full-time'),
                salary_min=None,
                salary_max=None,
                salary_currency='USD',
                description=job.get('jobExcerpt', '') or job.get('jobDescription', ''),
                requirements=', '.join(job.get('jobLevel', [])) if isinstance(job.get('jobLevel'), list) else job.get('jobLevel', ''),
                url=job.get('url', ''),
                posted_date=job.get('pubDate', '')[:10] if job.get('pubDate') else None,
                raw_data={'source': 'jobicy', 'tags': tags},
            )

    def classify_role(self, tags, title):
        text = title.lower() + ' ' + ' '.join(t.lower() for t in tags)
        if any(k in text for k in ['machine learning', 'ml', 'ai', 'deep learning', 'nlp']):
            return 'AI/ML'
        if any(k in text for k in ['data science', 'data analyst', 'analytics']):
            return 'Data Science'
        if any(k in text for k in ['devops', 'sre', 'infrastructure', 'kubernetes', 'docker']):
            return 'DevOps'
        if any(k in text for k in ['frontend', 'front-end', 'react', 'vue', 'angular']):
            return 'Frontend'
        if any(k in text for k in ['backend', 'back-end', 'django', 'rails', 'node']):
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
