BOT_NAME = 'job_scraper'

SPIDER_MODULES = ['job_scraper.spiders']
NEWSPIDER_MODULE = 'job_scraper.spiders'

# ============================================================================
# PERFORMANCE OPTIMIZATION - 8x FASTER
# ============================================================================

# Concurrency Settings (8x increase)
CONCURRENT_REQUESTS = 32  # Up from 4 (8x parallelism)
CONCURRENT_REQUESTS_PER_DOMAIN = 16  # Up from 1
CONCURRENT_ITEMS = 100  # Process 100 items in parallel

# Download Settings (remove artificial delays)
DOWNLOAD_DELAY = 0  # Remove delay (was 2 seconds)
RANDOMIZE_DOWNLOAD_DELAY = False  # Disable randomization
DOWNLOAD_TIMEOUT = 15  # Fail fast on slow sites

# AutoThrottle (smart rate limiting)
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 0.5  # Start fast
AUTOTHROTTLE_MAX_DELAY = 3  # Max delay if server is slow
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0  # Average concurrent requests per domain
AUTOTHROTTLE_DEBUG = False

# Respect robots.txt but don't let it block us
ROBOTSTXT_OBEY = True

# User Agent
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# ============================================================================
# PIPELINE OPTIMIZATION - Early filtering + Async batching
# ============================================================================

ITEM_PIPELINES = {
    'job_scraper.pipelines.TechJobFilterPipeline': 50,      # Filter non-tech EARLY (60% reduction)
    'job_scraper.pipelines.CleaningPipeline': 100,          # Clean text
    'job_scraper.pipelines.DeduplicationPipeline': 200,     # Drop duplicates in-memory
    'job_scraper.pipelines.AsyncBatchPipeline': 300,        # Async batch sending (10x faster)
}

# ============================================================================
# CACHING - Avoid re-downloading unchanged pages
# ============================================================================

HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600  # Cache for 1 hour
HTTPCACHE_DIR = 'httpcache'
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 408, 429]
HTTPCACHE_STORAGE = 'scrapy.extensions.httpcache.FilesystemCacheStorage'

# ============================================================================
# DISABLE UNNECESSARY FEATURES - Reduce overhead
# ============================================================================

COOKIES_ENABLED = False  # Most job boards don't need cookies
TELNETCONSOLE_ENABLED = False  # Disable telnet console
RETRY_ENABLED = True
RETRY_TIMES = 2  # Retry failed requests twice
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# ============================================================================
# MEMORY & REACTOR OPTIMIZATION
# ============================================================================

REACTOR_THREADPOOL_MAXSIZE = 20  # More threads for DNS/blocking ops
DNSCACHE_ENABLED = True  # Cache DNS lookups
DNSCACHE_SIZE = 10000

# ============================================================================
# SOURCE PRIORITY - Smart scheduling based on data analysis
# ============================================================================
# High-value sources (alert rate > 20%) → scrape every 2 hours
# Medium sources (15-20%) → scrape every 6 hours  
# Low sources (<15%) → scrape once daily

SOURCE_PRIORITY = {
    'nature_careers': {'priority': 1, 'frequency_hours': 2},   # 21.7% alert rate
    'indeed': {'priority': 2, 'frequency_hours': 2},           # 21.4% alert rate
    'remoteok': {'priority': 3, 'frequency_hours': 2},         # 20.5% alert rate
    'linkedin': {'priority': 4, 'frequency_hours': 6},         # 17.8% alert rate
    'weworkremotely': {'priority': 5, 'frequency_hours': 24},  # 16.5% alert rate (lowest)
}

# ============================================================================
# PLAYWRIGHT (only for JS-heavy sites)
# ============================================================================

PLAYWRIGHT_LAUNCH_OPTIONS = {
    'headless': True,
    'timeout': 15000,  # Reduced from 30s
}

# ============================================================================
# BACKEND API CONFIGURATION
# ============================================================================

BACKEND_API_URL = 'http://localhost:5000/api/jobs/ingest'
BATCH_SIZE = 100  # Send 100 jobs per batch (up from 10)
MAX_CONCURRENT_BATCHES = 5  # Send 5 batches in parallel

# ============================================================================
# REDIS QUEUE (Optional - for production)
# ============================================================================

REDIS_ENABLED = False  # Set to True to enable queue-based architecture
REDIS_URL = 'redis://localhost:6379/0'
REDIS_QUEUE_NAME = 'job_scraping_queue'

# ============================================================================
# LOGGING
# ============================================================================

LOG_LEVEL = 'INFO'  # Change to DEBUG for troubleshooting
LOG_FORMAT = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
LOG_DATEFORMAT = '%Y-%m-%d %H:%M:%S'
