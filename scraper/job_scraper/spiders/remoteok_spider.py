import json
from job_scraper.spiders.base_spider import BaseJobSpider

class RemoteOKSpider(BaseJobSpider):
    name = 'remoteok'
    allowed_domains = ['remoteok.com']
    start_urls = ['https://remoteok.com/api']

    custom_settings = {
        'DOWNLOAD_DELAY': 2,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=3, *args, **kwargs)

    def parse(self, response):
        data = json.loads(response.text)
        jobs = [j for j in data if isinstance(j, dict) and j.get('position')]

        for job in jobs:
            tags = job.get('tags') or []
            role_type = self.classify_role(tags, job.get('position', ''))
            salary_min = job.get('salary_min') or None
            salary_max = job.get('salary_max') or None

            yield self.create_job_item(
                external_id=str(job.get('id')),
                title=job.get('position', '').strip(),
                company=job.get('company', '').strip(),
                location=job.get('location') or 'Remote',
                work_mode='remote',
                role_type=role_type,
                employment_type='full-time',
                salary_min=salary_min if salary_min and salary_min > 0 else None,
                salary_max=salary_max if salary_max and salary_max > 0 else None,
                salary_currency='USD',
                description=job.get('description', ''),
                requirements=', '.join(tags),
                url=job.get('apply_url') or job.get('url'),
                posted_date=job.get('date', '')[:10] if job.get('date') else None,
                raw_data={'tags': tags, 'source': 'remoteok'},
            )

    def classify_role(self, tags, title):
        title_lower = title.lower()
        tags_lower = [t.lower() for t in tags]
        all_text = title_lower + ' ' + ' '.join(tags_lower)

        if any(k in all_text for k in ['machine learning', 'ml', 'ai ', 'deep learning', 'nlp']):
            return 'AI/ML'
        if any(k in all_text for k in ['data scientist', 'data science', 'analytics']):
            return 'Data Science'
        if any(k in all_text for k in ['devops', 'sre', 'infrastructure', 'kubernetes', 'docker']):
            return 'DevOps'
        if any(k in all_text for k in ['frontend', 'front-end', 'react', 'vue', 'angular']):
            return 'Frontend'
        if any(k in all_text for k in ['backend', 'back-end', 'api', 'django', 'rails']):
            return 'Backend'
        if any(k in all_text for k in ['full stack', 'fullstack']):
            return 'Full Stack'
        if any(k in all_text for k in ['design', 'ux', 'ui ']):
            return 'Design'
        if any(k in all_text for k in ['marketing', 'growth', 'seo']):
            return 'Marketing'
        if any(k in all_text for k in ['manager', 'product manager', 'pm ']):
            return 'Product'
        return 'Software Engineering'
