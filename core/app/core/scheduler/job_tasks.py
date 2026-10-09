# job_tasks.py

import asyncio

from app.core.config.celery_config import celery_app
from app.core.config.config import settings
from app.core.config.logger import logger
from app.core.messaging.message_service import MessageService
from app.core.newsletter.newsletter_service import NewsletterService
from app.core.scheduler.scheduler_service import SchedulerService
from app.db.database import SessionLocal
from app.db.redis_service import RedisService
from app.integrations.slack.slack import process_newsletter_for_slack

# Initialize services
redis_service = RedisService()
message_service = MessageService(redis_service)
scheduler_service = SchedulerService(message_service)


@celery_app.task(name="tasks.produce_messages")
def produce_messages():
    """Use dedicated event loop for each task"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(scheduler_service.produce_messages_async())
    finally:
        loop.close()


@celery_app.task(name="tasks.consume_messages")
def consume_messages():
    """Consumer: Processes and sends queued messages"""
    try:
        asyncio.run(scheduler_service.consume_messages_async())
    except Exception as e:
        logger.error(f"Consumer error: {str(e)}")


@celery_app.task(name="tasks.send_newsletter_task")
def send_newsletter_task(email: str):
    db = SessionLocal()
    redis_service = RedisService()
    message_service = MessageService(redis_service)
    newsletter_service = NewsletterService(message_service, db)
    try:
        result = asyncio.run(newsletter_service.schedule_immediate_newsletter(email))
        return result
    except Exception as e:
        raise e
    finally:
        db.close()


# Post the daily team brief to one Slack channel (optional)
@celery_app.task(name="tasks.send_team_newsletter_task")
def send_team_newsletter_task():
    if not settings.TEAM_SLACK_CHANNEL_ID:
        logger.info("TEAM_SLACK_CHANNEL_ID not set, skipping team brief")
        return {"status": "skipped"}
    logger.info("Sending daily brief to the team Slack channel")
    db = SessionLocal()
    try:
        result = asyncio.run(process_newsletter_for_slack(
            channel_id=settings.TEAM_SLACK_CHANNEL_ID,
            user_id="",
            option={"ephemeral": False, "message_prefix": ""}
        ))
        logger.info(f"Newsletter task result: {result}")
        return result
    except Exception as e:
        logger.error(f"Unhandled exception in send_team_newsletter_task: {str(e)}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()