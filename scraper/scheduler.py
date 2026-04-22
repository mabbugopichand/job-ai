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

# Ordered by alert rate from analysis: Nature Careers 21.7%, Indeed 21.4%, RemoteOK 20.5%
# LinkedIn 17.8%, WeWorkRemotely 16.5% (runs half as often)
SPIDERS = ['remoteok', 'jobicy', 'arbeitnow', 'themuse']
HIGH_SIGNAL_SPIDERS = ['remoteok', 'jobicy']   # run every cycle
LOW_SIGNAL_SPIDERS  = ['arbeitnow', 'themuse']  # run every other cycle
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


def run_weekly_analysis():
    """Run data analysis every Monday and push charts to docs/analysis/."""
    if datetime.now().weekday() != 0:  # 0 = Monday
        return
    log.info("Running weekly analysis...")
    try:
        subprocess.run(['python3', 'docs/analysis/job_analysis.py'], timeout=120, check=True)
        log.info("Weekly analysis complete. Charts saved to docs/analysis/")
    except Exception as e:
        log.error(f"Weekly analysis failed: {e}")


def _parse_count(output):
    import re
    m = re.search(r"item_scraped_count': (\d+)", output)
    return m.group(1) if m else 'unknown'


if __name__ == '__main__':
    log.info(f"Scheduler started. Running every {INTERVAL_HOURS} hours.")
    cycle = 0
    while True:
        # High-signal spiders every cycle; low-signal every other cycle
        spiders_this_run = HIGH_SIGNAL_SPIDERS + (LOW_SIGNAL_SPIDERS if cycle % 2 == 0 else [])
        SPIDERS[:] = spiders_this_run
        run_all_spiders()
        run_weekly_analysis()
        cycle += 1
        log.info(f"Next run in {INTERVAL_HOURS} hours.")
        time.sleep(INTERVAL_HOURS * 3600)
