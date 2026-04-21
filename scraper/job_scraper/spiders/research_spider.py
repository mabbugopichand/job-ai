import json
from job_scraper.spiders.base_spider import BaseJobSpider

class ResearchSpider(BaseJobSpider):
    """Scrapes research/academic jobs from Arbeitnow filtered by research tags
    and from RemoteOK research category."""
    name = 'research'
    allowed_domains = ['arbeitnow.com', 'remoteok.com']
    start_urls = [
        'https://www.arbeitnow.com/api/job-board-api',
        'https://remoteok.com/api?tag=phd',
    ]

    custom_settings = {'DOWNLOAD_DELAY': 2}

    RESEARCH_KEYWORDS = [
        'research', 'phd', 'postdoc', 'scientist', 'academic',
        'fellowship', 'laboratory', 'university', 'professor', 'scholar'
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(source_id=7, *args, **kwargs)

    def parse(self, response):
        if 'arbeitnow' in response.url:
            yield from self._parse_arbeitnow(response)
        elif 'remoteok' in response.url:
            yield from self._parse_remoteok(response)

    def _parse_arbeitnow(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        for job in data.get('data', []):
            title = job.get('title', '').lower()
            desc = job.get('description', '').lower()
            tags = [t.lower() for t in (job.get('tags') or [])]
            all_text = title + ' ' + desc + ' ' + ' '.join(tags)
            if not any(k in all_text for k in self.RESEARCH_KEYWORDS):
                continue
            yield self.create_job_item(
                external_id=f"arb-{job.get('slug', '')}",
                title=job.get('title', '').strip(),
                company=job.get('company_name', '').strip(),
                location=job.get('location', 'Remote'),
                work_mode='remote' if job.get('remote') else 'onsite',
                role_type=self._classify_research(job.get('title', '')),
                employment_type='full-time',
                salary_min=None,
                salary_max=None,
                salary_currency='USD',
                description=job.get('description', ''),
                requirements=', '.join(job.get('tags', [])),
                url=job.get('url', ''),
                posted_date=str(job.get('created_at', ''))[:10] if job.get('created_at') else None,
                raw_data={'source': 'arbeitnow_research'},
            )

    def _parse_remoteok(self, response):
        try:
            data = json.loads(response.text)
        except Exception:
            return
        jobs = [j for j in data if isinstance(j, dict) and j.get('position')]
        for job in jobs:
            tags = [t.lower() for t in (job.get('tags') or [])]
            title = job.get('position', '').lower()
            if not any(k in title + ' '.join(tags) for k in self.RESEARCH_KEYWORDS):
                continue
            yield self.create_job_item(
                external_id=f"rok-{job.get('id', '')}",
                title=job.get('position', '').strip(),
                company=job.get('company', '').strip(),
                location='Remote',
                work_mode='remote',
                role_type=self._classify_research(job.get('position', '')),
                employment_type='full-time',
                salary_min=job.get('salary_min') or None,
                salary_max=job.get('salary_max') or None,
                salary_currency='USD',
                description=job.get('description', ''),
                requirements=', '.join(job.get('tags', [])),
                url=job.get('apply_url') or job.get('url', ''),
                posted_date=job.get('date', '')[:10] if job.get('date') else None,
                raw_data={'source': 'remoteok_research'},
            )

    def _classify_research(self, title):
        t = title.lower()
        if 'postdoc' in t or 'post-doc' in t:
            return 'Postdoctoral Researcher'
        if 'phd' in t or 'doctoral' in t:
            return 'PhD Position'
        if 'research associate' in t:
            return 'Research Associate'
        if 'research assistant' in t:
            return 'Research Assistant'
        if 'fellowship' in t:
            return 'Fellowship'
        if 'scientist' in t:
            return 'Research Scientist'
        return 'Research Position'
