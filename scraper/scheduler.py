#!/usr/bin/env python3
"""
Scheduler: runs all spiders every 6 hours automatically.
Run with: python3 scheduler.py
"""
import time
import subprocess
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

SPIDERS = ['remoteok', 'jobicy', 'arbeitnow', 'themuse']
INTERVAL_HOURS = 6


def run_all_spiders():
    log.info(f"Starting scrape run at {datetime.now()}")
    for spider in SPIDERS:
        log.info(f"Running spider: {spider}")
        try:
            result = subprocess.run(
                ['python3', '-m', 'scrapy', 'crawl', spider],
                capture_output=True, text=True, timeout=300
            )
            log.info(f"{spider} done. Items scraped: {_parse_count(result.stdout + result.stderr)}")
        except subprocess.TimeoutExpired:
            log.warning(f"{spider} timed out")
        except Exception as e:
            log.error(f"{spider} failed: {e}")
    log.info("Scrape run complete.")


def _parse_count(output):
    import re
    m = re.search(r"item_scraped_count': (\d+)", output)
    return m.group(1) if m else 'unknown'


if __name__ == '__main__':
    log.info(f"Scheduler started. Running every {INTERVAL_HOURS} hours.")
    while True:
        run_all_spiders()
        log.info(f"Next run in {INTERVAL_HOURS} hours.")
        time.sleep(INTERVAL_HOURS * 3600)
