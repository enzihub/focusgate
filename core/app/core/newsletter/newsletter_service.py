# newsletter_service.py

from datetime import datetime
from pathlib import Path
from typing import Dict

import jinja2
import pytz
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config.logger import logger
from app.core.messaging.message_service import MessageService
from app.core.user.user_service import UserService
from app.db.models import UserSlackWorkspace
from app.integrations.slack.slack import generate_newsletter_content


class NewsletterService:
    def __init__(self, message_service: MessageService, db: Session):  # Add db parameter
        self.message_service = message_service
        self.db = db  # Store the session
        self.template_dir = Path(__file__).parent.parent.parent.parent / "templates"
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(self.template_dir), autoescape=True
        )

    async def render_newsletter_template(self, template_data: Dict) -> str:
        """Render the newsletter HTML template."""
        template = self.template_env.get_template("newsletter.html")
        return template.render(**template_data)

    def get_now_in_user_tz(self, timezone_str: str) -> str:
        """Format current timestamp in user's timezone."""
        user_tz = pytz.timezone(timezone_str)
        now = datetime.now().astimezone(user_tz)
        return now.strftime("%B %d, %Y")

    async def schedule_immediate_newsletter(self, email: str):
        """Schedule an immediate newsletter for a specific user."""
        try:
            user_service = UserService(self.db)
            user_details = await user_service.get_user_details(email)
            user_prefs = await user_service.get_user_prefs(email)

            if not user_details:
                raise ValueError("User not found")

            # Generate message content

            # TOOD: get actual content
            # message_payload = {
            #     "subject": "Hello this is the immediate subject",
            #     "body": "Hello this is the body",
            # }

            clerk_id = user_details["clerk_id"]
            user_timezone = user_prefs["timezone"]
            # Get the youtube_token from the clerk
            # youtube_token = await get_user_token(clerk_id, "oauth_google")

            # slack_token = await get_user_token(clerk_id, "oauth_slack")

            # We have to get the slack_token from the database because we need to use it to generate the newsletter content
            # This token is different from the one given to us by clerk because it doesn't have the scopes
            # slack_token = await get_user_token(clerk_id, "oauth_slack", self.db)
            slack_workspace = self.db.query(UserSlackWorkspace).filter(
                UserSlackWorkspace.user_id == user_details["user_id"]).first()
            if not slack_workspace:
                raise HTTPException(status_code=404, detail="No Slack workspace found for user")
            slack_token = str(slack_workspace.user_access_token)

            message_payload = await generate_newsletter_content(slack_token, user_timezone)
            message_data = self.message_service.get_message_data(
                user_details, message_payload, datetime.now().timestamp()
            )
            # Enqueue message with status "sent immediately"
            success = self.message_service.enqueue_message(
                user_details["user_id"], datetime.now(), message_data
            )

            if success:
                logger.info(f"Newsletter scheduled for immediate send to {email}")
                return {"status": "scheduled for immediate sending"}
            else:
                raise HTTPException(status_code=500, detail="Failed to send newsletter")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def preprocess_messages(self, content: str) -> str:
        """Preprocess the input content."""
        # TODO: Add preprocessing logic here
        return content

    async def get_newsletter_preferences(self, user_id: str) -> Dict:
        """Fetch newsletter preferences for a user."""
        try:
            # Mock data for demonstration
            return {"user_id": "123", "pref_hour": "10", "timezone": "Asia/Colombo"}
        except Exception as e:
            logger.error(f"Error fetching newsletter preferences: {str(e)}")
            raise ValueError("Newsletter preferences not found")
