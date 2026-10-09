# app/routes.py
from datetime import datetime

import pytz

# app/core/api/routes.py
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from openai import BaseModel
from sqlalchemy.orm import Session
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config.config import settings
from app.core.config.logger import logger
from app.core.messaging.message_service import MessageService
from app.core.scheduler.job_tasks import send_newsletter_task
from app.core.scheduler.scheduler_service import SchedulerService
from app.db.database import get_db
from app.db.redis_service import RedisService
from app.integrations.slack.slack import signature_verifier, process_summary, process_newsletter_for_slack
from app.core.scheduler.job_tasks import send_newsletter_task

router = APIRouter()

# Initialize services
redis_service = RedisService()
message_service = MessageService(redis_service)
scheduler_service = SchedulerService(message_service)


class NewsletterRequest(BaseModel):
    email: str


@router.post("/send-newsletter")
async def send_newsletter(request: NewsletterRequest, db: Session = Depends(get_db)):
    """Endpoint to trigger immediate newsletter sending for a specific user"""
    try:
        email = request.email
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        # Schedule for immediate sending
        logger.info(f"Received request to send newsletter to {email}")
        send_newsletter_task.delay(email)

        return {"status": "Newsletter sending scheduled"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health")
async def health_check(request: Request):
    body = await request.body()
    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")
    return {
        "response_type": "in_channel",
        "text": "All engines are running smoothly! 🚀🚀🚀",
    }


@router.post("/news")
async def get_summary(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    form_data = await request.form()

    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")

    # Extract Slack command and options
    command_text = form_data.get("text", "").strip()
    channel_id = form_data.get("channel_id")
    user_id = form_data.get("user_id")

    options = {
        "0": {"ephemeral": True, "message_prefix": ""},
        "1": {"ephemeral": False, "message_prefix": ""},
    }

    selected_option = options.get(command_text.lower(), options["0"])
    background_tasks.add_task(process_summary, channel_id, selected_option, user_id)

    return JSONResponse(
        {"response_type": "ephemeral", "text": "Processing your request..."},
        status_code=200,
    )


@router.post("/focusgate")
async def get_newsletter(request: Request, background_tasks: BackgroundTasks):
    """Endpoint for the /newsletter Slack command"""
    body = await request.body()
    form_data = await request.form()

    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")

    # Extract Slack command and options
    command_text = form_data.get("text", "").strip()
    channel_id = form_data.get("channel_id")
    user_id = form_data.get("user_id")

    # Get user token from request context (if available)
    # This depends on your authentication setup
    # For simplicity, we'll use the bot token here

    options = {
        "0": {"ephemeral": True, "message_prefix": ""},
        "1": {"ephemeral": False, "message_prefix": ""},
    }

    selected_option = options.get(command_text.lower(), options["0"])
    background_tasks.add_task(process_newsletter_for_slack, channel_id, user_id, selected_option)

    return JSONResponse(
        {"response_type": "ephemeral", "text": "Generating your newsletter..."},
        status_code=200,
    )


@router.post("/time")
async def get_time(request: Request):
    body = await request.body()
    form_data = await request.form()

    if not signature_verifier.is_valid_request(body, request.headers):
        raise HTTPException(status_code=400, detail="Invalid Slack request")

    # Extract Slack command and options
    command_text = form_data.get("text", "").strip()
    visibility = "1" if command_text.lower() == "1" else "0"

    time_zones = {
        "🇺🇸 SF": "America/Los_Angeles",
        "🇰🇪 Nairobi": "Africa/Nairobi",
        "🇱🇰 Sri Lanka": "Asia/Colombo",
        "🇪🇸 Madrid": "Europe/Paris",
    }
    try:
        response_type = "in_channel" if visibility == "1" else "ephemeral"

        formatted_output = ""
        for tz_name, tz_value in time_zones.items():
            tz = pytz.timezone(tz_value)
            current_time = datetime.now(tz)
            time_formatted = current_time.strftime("%a %m/%d (%I:%M %p)")
            formatted_output += f"*{tz_name}:* {time_formatted}\n"

        return JSONResponse(
            content={
                "response_type": response_type,
                "text": formatted_output,
            }
        )

    except Exception as e:
        return {"error": "Something went wrong.", "details": str(e)}


@router.get("/")
async def root():
    return {"message": "Hello World", "environment": settings.ENVIRONMENT}


@router.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@router.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0


@router.get("/health")
async def health_check():
    return {"status": "ok"}