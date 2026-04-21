import json
from job_scraper.spiders.base_spider import BaseJobSpider

class TheMuseSpider(BaseJobSpider):
    name = 'themuse'
    allowed_domains = ['www.themuse.com']
    start_urls = [
        'https://www.themuse.com/api/public/jobs?category=Software+Engineer&page=1&descending=true&level=Senior+Level',
        'https://www.themuse.com/api/public/jobs?category=Data+Science&page=1&descending=true',
        'https://www.themuse.com/api/public/jobs?category=Design+%26+UX&page=1&descending=true',
    ]

    custom_settings = {'DOWNLOAD_DELAY': 2}

    CATEGORY_MAP = {
        'Software Engineer': 'Software Engineering',
        'Data Science': 'Data Science',
        'Design & UX': 'Design',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=11, *args, **kwargs)

    def parse(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        for job in data.get('results', []):
            locations = job.get('locations', [])
            location = locations[0].get('name', 'Remote') if locations else 'Remote'
            levels = job.get('levels', [])
            level = levels[0].get('name', '') if levels else ''
            categories = job.get('categories', [])
            cat_name = categories[0].get('name', '') if categories else ''
            role_type = self.CATEGORY_MAP.get(cat_name, 'Software Engineering')
            yield self.create_job_item(
                external_id=str(job.get('id', '')),
                title=job.get('name', '').strip(),
                company=job.get('company', {}).get('name', '').strip(),
                location=location,
                work_mode='remote' if 'remote' in location.lower() else 'onsite',
                role_type=role_type,
                employment_type='full-time',
                salary_min=None,
                salary_max=None,
                salary_currency='USD',
                description=job.get('contents', ''),
                requirements=level,
                url=job.get('refs', {}).get('landing_page', ''),
                posted_date=job.get('publication_date', '')[:10] if job.get('publication_date') else None,
                raw_data={'source': 'themuse', 'level': level},
            )
