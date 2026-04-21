import json
from job_scraper.spiders.base_spider import BaseJobSpider

class AdzunaSpider(BaseJobSpider):
    name = 'adzuna'
    allowed_domains = ['api.adzuna.com']
    
    custom_settings = {'DOWNLOAD_DELAY': 2}

    CATEGORIES = [
        ('it-jobs', 'Software Engineering'),
        ('engineering-jobs', 'Engineering'),
        ('scientific-research-jobs', 'Research'),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=2, *args, **kwargs)  # Indeed
        self.start_urls = [
            f'https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=test&app_key=test&results_per_page=50&category={cat}&content-type=application/json'
            for cat, _ in self.CATEGORIES
        ]
        self._cat_map = {
            f'https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=test&app_key=test&results_per_page=50&category={cat}&content-type=application/json': role
            for cat, role in self.CATEGORIES
        }

    def parse(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        role_type = self._cat_map.get(response.url, 'Software Engineering')
        for job in data.get('results', []):
            salary_min = job.get('salary_min')
            salary_max = job.get('salary_max')
            yield self.create_job_item(
                external_id=str(job.get('id', '')),
                title=job.get('title', '').strip(),
                company=job.get('company', {}).get('display_name', '').strip(),
                location=job.get('location', {}).get('display_name', ''),
                work_mode=self._detect_work_mode(job.get('title', ''), job.get('description', '')),
                role_type=role_type,
                employment_type='full-time',
                salary_min=int(salary_min) if salary_min else None,
                salary_max=int(salary_max) if salary_max else None,
                salary_currency='USD',
                description=job.get('description', ''),
                requirements='',
                url=job.get('redirect_url', ''),
                posted_date=job.get('created', '')[:10] if job.get('created') else None,
                raw_data={'source': 'adzuna', 'category': role_type},
            )

    def _detect_work_mode(self, title, desc):
        text = (title + ' ' + desc).lower()
        if 'remote' in text:
            return 'remote'
        if 'hybrid' in text:
            return 'hybrid'
        return 'onsite'
