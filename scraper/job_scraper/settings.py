BOT_NAME = 'job_scraper'

SPIDER_MODULES = ['job_scraper.spiders']
NEWSPIDER_MODULE = 'job_scraper.spiders'

ROBOTSTXT_OBEY = True
CONCURRENT_REQUESTS = 4
DOWNLOAD_DELAY = 2
RANDOMIZE_DOWNLOAD_DELAY = True

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

ITEM_PIPELINES = {
    'job_scraper.pipelines.CleaningPipeline': 100,
    'job_scraper.pipelines.DeduplicationPipeline': 200,
    'job_scraper.pipelines.BackendPipeline': 300,
}

PLAYWRIGHT_LAUNCH_OPTIONS = {
    'headless': True,
    'timeout': 30000,
}

BACKEND_API_URL = 'http://localhost:5000/api/jobs/ingest'
