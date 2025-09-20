#!/usr/bin/env python3
"""
Care Compass Scheduler
Sets up weekly automated data refresh for healthcare facilities
"""

import os
import logging
import schedule
import time
from datetime import datetime
from seeder import HealthcareSeeder

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('seeder.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_weekly_seed():
    """Run the weekly seeding job"""
    try:
        logger.info("🕐 Starting scheduled weekly seed job...")
        start_time = datetime.utcnow()

        seeder = HealthcareSeeder()
        seeder.seed_database()

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        logger.info(f"✅ Weekly seed completed successfully in {duration:.2f} seconds")

    except Exception as e:
        logger.error(f"❌ Weekly seed failed: {e}")
        raise

def setup_scheduler():
    """Setup the weekly scheduling"""
    # Schedule for every Sunday at 2 AM
    schedule.every().sunday.at("02:00").do(run_weekly_seed)

    logger.info("📅 Scheduler configured:")
    logger.info("  - Weekly refresh: Every Sunday at 2:00 AM")
    logger.info("  - Next run: " + str(schedule.next_run()))

def run_scheduler():
    """Run the scheduler continuously"""
    setup_scheduler()

    logger.info("🚀 Scheduler started. Press Ctrl+C to stop.")

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    except KeyboardInterrupt:
        logger.info("⏹️  Scheduler stopped by user")
    except Exception as e:
        logger.error(f"❌ Scheduler error: {e}")
        raise

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "now":
        # Run seeding immediately for testing
        logger.info("🧪 Running seed job immediately (test mode)")
        run_weekly_seed()
    else:
        # Run the scheduler
        run_scheduler()