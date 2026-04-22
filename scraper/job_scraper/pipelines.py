import re
import aiohttp
import asyncio
from datetime import datetime
from scrapy.exceptions import DropItem
import logging
from twisted.internet import reactor
from scrapy.utils.reactor import install_reactor

logger = logging.getLogger(__name__)

# ============================================================================
# TECH JOB KEYWORDS - Expanded for 60% filtering (up from 36%)
# ============================================================================

TECH_KEYWORDS = {
    # Core tech roles
    'devops', 'sre', 'site reliability', 'cloud engineer', 'platform engineer',
    'infrastructure engineer', 'automation engineer', 'release engineer',
    
    # Cloud & containers
    'kubernetes', 'k8s', 'docker', 'container', 'aws', 'azure', 'gcp', 'cloud',
    'terraform', 'ansible', 'chef', 'puppet', 'cloudformation',
    
    # CI/CD
    'jenkins', 'gitlab', 'github actions', 'ci/cd', 'cicd', 'continuous integration',
    'continuous deployment', 'argocd', 'spinnaker',
    
    # Monitoring & observability
    'prometheus', 'grafana', 'datadog', 'new relic', 'elk', 'splunk',
    'monitoring', 'observability', 'logging',
    
    # Programming (backend focus)
    'python', 'go', 'golang', 'java', 'node.js', 'nodejs', 'rust',
    'backend', 'api', 'microservices', 'distributed systems',
    
    # Databases
    'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'database', 'sql', 'nosql',
    
    # Software engineering
    'software engineer', 'full stack', 'fullstack', 'frontend', 'react',
    'vue', 'angular', 'typescript', 'javascript',
    
    # Data & ML
    'data engineer', 'machine learning', 'ml engineer', 'data scientist',
    'mlops', 'ai engineer', 'deep learning',
    
    # Security
    'security engineer', 'devsecops', 'cybersecurity', 'infosec',
}

NON_TECH_ROLES = {
    'postdoc', 'postdoctoral', 'phd position', 'research associate',
    'research assistant', 'fellowship', 'academic writer', 'research writer',
    'proposal writer', 'sales', 'marketing', 'hr ', 'human resources',
    'recruiter', 'account manager', 'customer success', 'support specialist',
    'content writer', 'copywriter', 'graphic designer', 'ui designer',
    'project manager', 'product manager', 'scrum master', 'business analyst',
}


class TechJobFilterPipeline:
    """Filter non-tech jobs EARLY - saves 60% of processing (up from 36%)."""
    
    def __init__(self):
        self.filtered_count = 0
        self.passed_count = 0
    
    def process_item(self, item, spider):
        title = (item.get('title') or '').lower()
        description = (item.get('description') or '').lower()
        role_type = (item.get('role_type') or '').lower()
        
        # Check if explicitly non-tech role
        if any(keyword in role_type for keyword in NON_TECH_ROLES):
            self.filtered_count += 1
            raise DropItem(f"Non-tech role filtered: {role_type}")
        
        # Check if title/description contains tech keywords
        combined_text = f"{title} {description} {role_type}"
        has_tech_keyword = any(keyword in combined_text for keyword in TECH_KEYWORDS)
        
        if not has_tech_keyword:
            self.filtered_count += 1
            raise DropItem(f"No tech keywords found in: {title}")
        
        self.passed_count += 1
        return item
    
    def close_spider(self, spider):
        total = self.filtered_count + self.passed_count
        if total > 0:
            filter_rate = (self.filtered_count / total) * 100
            logger.info(f"Tech Filter: {self.passed_count} passed, {self.filtered_count} filtered ({filter_rate:.1f}%)")


class CleaningPipeline:
    """Clean text fields - remove extra whitespace."""
    
    def process_item(self, item, spider):
        if item.get('title'):
            item['title'] = self.clean_text(item['title'])
        if item.get('company'):
            item['company'] = self.clean_text(item['company'])
        if item.get('description'):
            item['description'] = self.clean_text(item['description'])
        if item.get('requirements'):
            item['requirements'] = self.clean_text(item['requirements'])
        
        return item
    
    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


class DeduplicationPipeline:
    """Drop duplicates in-memory - prevents sending dupes to backend."""
    
    def __init__(self):
        self.seen = set()
        self.duplicate_count = 0
    
    def process_item(self, item, spider):
        # Use URL as primary dedup key (more reliable than title+company)
        url = item.get('url', '')
        external_id = item.get('external_id', '')
        
        # Fallback to title+company if no URL
        if url:
            dedup_key = url.lower()
        elif external_id:
            dedup_key = f"{item.get('source_id')}-{external_id}".lower()
        else:
            dedup_key = f"{item.get('source_id')}-{item.get('title')}-{item.get('company')}".lower()
        
        if dedup_key in self.seen:
            self.duplicate_count += 1
            raise DropItem(f"Duplicate: {dedup_key[:50]}...")
        
        self.seen.add(dedup_key)
        return item
    
    def close_spider(self, spider):
        logger.info(f"Deduplication: {len(self.seen)} unique, {self.duplicate_count} duplicates dropped")


class AsyncBatchPipeline:
    """
    Async batch sending - 10x faster than synchronous requests.
    Sends jobs in batches of 100 with 5 concurrent batches.
    """
    
    def __init__(self):
        self.jobs_buffer = []
        self.batch_size = 100  # Up from 10 (10x larger batches)
        self.max_concurrent = 5  # Send 5 batches in parallel
        self.sent_count = 0
        self.error_count = 0
        self.pending_batches = []
    
    def process_item(self, item, spider):
        self.jobs_buffer.append(dict(item))
        
        # Send batch when buffer is full
        if len(self.jobs_buffer) >= self.batch_size:
            batch = self.jobs_buffer[:self.batch_size]
            self.jobs_buffer = self.jobs_buffer[self.batch_size:]
            self.pending_batches.append(batch)
            
            # Send batches if we have enough pending
            if len(self.pending_batches) >= self.max_concurrent:
                self._send_batches_sync()
        
        return item
    
    def close_spider(self, spider):
        # Send remaining jobs
        if self.jobs_buffer:
            self.pending_batches.append(self.jobs_buffer)
        
        if self.pending_batches:
            self._send_batches_sync()
        
        logger.info(f"AsyncBatch: {self.sent_count} jobs sent, {self.error_count} errors")
    
    def _send_batches_sync(self):
        """Send batches synchronously (Scrapy uses Twisted, not asyncio)."""
        import requests
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        def send_batch(batch):
            try:
                import os
                backend_url = os.environ.get('BACKEND_API_URL', 'http://localhost:5000/api/jobs/ingest')
                ingest_secret = os.environ.get('INGEST_SECRET', '')
                headers = {'x-ingest-secret': ingest_secret} if ingest_secret else {}
                response = requests.post(
                    backend_url,
                    json={'jobs': batch},
                    headers=headers,
                    timeout=30
                )
                response.raise_for_status()
                return len(batch), None
            except Exception as e:
                return 0, str(e)
        
        # Send batches in parallel using thread pool
        with ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
            futures = {executor.submit(send_batch, batch): batch for batch in self.pending_batches}
            
            for future in as_completed(futures):
                sent, error = future.result()
                if error:
                    self.error_count += len(futures[future])
                    logger.error(f"Batch send error: {error}")
                else:
                    self.sent_count += sent
                    logger.info(f"Sent batch of {sent} jobs (total: {self.sent_count})")
        
        self.pending_batches = []


# ============================================================================
# OPTIONAL: Redis Queue Pipeline (for production)
# ============================================================================

class RedisQueuePipeline:
    """
    Push jobs to Redis queue instead of directly to backend.
    Benefits: Non-blocking, retry handling, horizontal scaling.
    
    Architecture:
    Scraper → Redis Queue → Worker Processes → Database
    """
    
    def __init__(self):
        self.redis_client = None
        self.queue_name = 'job_scraping_queue'
        self.queued_count = 0
    
    def open_spider(self, spider):
        try:
            import redis
            self.redis_client = redis.from_url('redis://localhost:6379/0')
            self.redis_client.ping()
            logger.info("Redis queue connected")
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Falling back to direct sending.")
            self.redis_client = None
    
    def process_item(self, item, spider):
        if not self.redis_client:
            return item
        
        try:
            import json
            job_data = dict(item)
            self.redis_client.rpush(self.queue_name, json.dumps(job_data))
            self.queued_count += 1
            
            if self.queued_count % 100 == 0:
                logger.info(f"Queued {self.queued_count} jobs to Redis")
        except Exception as e:
            logger.error(f"Redis queue error: {e}")
        
        return item
    
    def close_spider(self, spider):
        if self.redis_client:
            logger.info(f"Total jobs queued: {self.queued_count}")
            self.redis_client.close()


# ============================================================================
# INCREMENTAL SCRAPING - Avoid re-scraping existing jobs
# ============================================================================

class IncrementalScrapingPipeline:
    """
    Check if job already exists in database before processing.
    Requires database connection to check existing URLs.
    """
    
    def __init__(self):
        self.existing_urls = set()
        self.skipped_count = 0
    
    def open_spider(self, spider):
        # Load existing job URLs from database
        try:
            import psycopg2
            import os
            conn = psycopg2.connect(
                host=os.environ.get('DB_HOST', '/tmp'),
                database=os.environ.get('DB_NAME', 'job_ai'),
                user=os.environ.get('DB_USER', 'vscode'),
                password=os.environ.get('DB_PASSWORD') or None,
                port=int(os.environ.get('DB_PORT', '5432'))
            )
            cursor = conn.cursor()
            cursor.execute("SELECT url FROM jobs WHERE url IS NOT NULL AND is_active = true")
            self.existing_urls = {row[0] for row in cursor.fetchall()}
            cursor.close()
            conn.close()
            logger.info(f"Loaded {len(self.existing_urls)} existing job URLs for incremental scraping")
        except Exception as e:
            logger.warning(f"Could not load existing URLs: {e}. Proceeding without incremental check.")
    
    def process_item(self, item, spider):
        url = item.get('url')
        if url and url in self.existing_urls:
            self.skipped_count += 1
            raise DropItem(f"Job already exists: {url}")
        
        return item
    
    def close_spider(self, spider):
        logger.info(f"Incremental: {self.skipped_count} existing jobs skipped")
