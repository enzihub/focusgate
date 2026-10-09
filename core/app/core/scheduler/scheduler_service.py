# scheduler_service.py

from datetime import datetime
from typing import Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config.logger import logger
from app.core.messaging.message_service import MessageService
from app.core.user.user_service import UserService
from app.db import database
from app.integrations.slack.slack import generate_newsletter_content


class SchedulerService:
    def __init__(self, message_service: MessageService):
        self.message_service = message_service

    async def get_users_for_scheduling(
            self, db: Session, lookahead_minutes: int
    ) -> List[Dict]:
        """
        Calls the stored procedure to get users whose prefTime is within the next lookahead window
        """
        try:
            query = text("SELECT * FROM get_scheduled_users(:lookahead_minutes)")
            result = db.execute(query, {"lookahead_minutes": lookahead_minutes})
            rows = result.fetchall()

            return [{
                "clerk_id": str(row.clerk_id),
                "user_id": str(row.user_id),
                "email": row.email,
                "phone": row.phone,
                "timezone": row.timezone,
                "scheduled_for": row.scheduled_for.isoformat(),
                "target_hour": row.target_hour,
                "local_time": row.local_time
            } for row in rows]
        except Exception as e:
            logger.error(f"Error fetching users for scheduling: {str(e)}")
            return []

    def create_error_payload(self, user: Dict, error_type: str, error_message: str, target_time: datetime,
                             details: str = None) -> Dict:
        """
        Create error message payload

        Args:
            user: Dictionary containing user information
            error_type: Type of error that occurred
            error_message: Human-readable error message
            target_time: Originally scheduled time for the newsletter
            details: Optional additional error details

        Returns:
            Dictionary containing the formatted error message payload
        """
        formatted_time = target_time.strftime("%dth of %B, %Y %I:%M %p UTC")
        return {
            "subject": "Failed to schedule newsletter",
            "body": f"Hi {user.get('email', 'valued customer')},\n\n"
                    f"Unfortunately, the newsletter that was scheduled for {formatted_time} "
                    f"failed due to the following reason:\n\n"
                    f"{error_message}\n\n"
                    f"Our team has been notified and we're working to resolve this issue. "
                    f"If you continue to experience problems, please contact our support team.\n\n"
                    f"\n\nBest regards,\n"
                    f"FocusGate Team",
            "error_type": error_type,
            "user_id": user["user_id"],
            "clerk_id": user["clerk_id"],
            "error_details": details,
            "original_scheduled_time": target_time.timestamp()
        }

    async def produce_messages_async(self):
        """Async logic for scheduling newsletters"""
        db = database.SessionLocal()
        try:
            users = await self.get_users_for_scheduling(db, 60)
            logger.info(f"Found {len(users)} users for scheduling")

            for user in users:
                msg_id = None
                try:
                    target_time = datetime.fromisoformat(user["scheduled_for"])
                    user_id = user["user_id"]
                    msg_id = self.message_service._get_message_key(user_id, target_time.timestamp())

                    # Check existing newsletters
                    if any(abs(float(n["scheduled_time"]) - target_time.timestamp()) < 3600
                           for n in self.message_service.get_user_messages(user_id)):
                        logger.info(f"Message already scheduled for {user_id} at {target_time}")
                        continue

                    # Create and enqueue placeholder message
                    message_data = self.message_service.get_message_data(
                        user,
                        {
                            "subject": "Newsletter being generated...",
                            "body": "Your newsletter is being generated..."
                        },
                        target_time.timestamp()
                    )

                    if not self.message_service.enqueue_message(user_id, target_time, message_data):
                        logger.error(f"Failed to enqueue initial message for {user_id}")
                        continue

                    # Generate content
                    try:
                        user_service = UserService(db)
                        slack_token = await user_service.get_user_slack_workspace_token(user_id)
                        if not slack_token:
                            raise Exception(
                                "Slack connection not found. Please reconnect Slack to continue receiving newsletters.")

                        message_payload = await generate_newsletter_content(slack_token, user["timezone"])
                        if not self.message_service.update_message_content(msg_id, message_payload):
                            raise Exception("Failed to update message content")

                        logger.info(f"Updated message content for {user_id} at {target_time}")

                    except Exception as e:
                        error_msg = str(e)
                        if "resource_not_found" in error_msg and "oauth_slack" in error_msg:
                            error_msg = "Slack connection not found. Please reconnect Slack to continue receiving newsletters."

                        logger.error(f"Content generation failed for {user.get('email')}: {error_msg}")

                        # Update the placeholder message with error content
                        error_payload = self.create_error_payload(
                            user,
                            "content_generation_failure",
                            error_msg,
                            target_time,
                            str(e)
                        )
                        if not self.message_service.update_message_content(msg_id, error_payload, scheduled_time=datetime.now().timestamp()):
                            logger.error(f"Failed to update message with error content for {user_id}")

                except Exception as e:
                    error_msg = f"Failed to process newsletter: {str(e)}"
                    logger.error(f"{error_msg} for {user.get('email')}")

                    if msg_id:  # Update the placeholder message if it was created
                        error_payload = self.create_error_payload(
                            user,
                            "processing_failure",
                            error_msg,
                            target_time,
                            str(e)
                        )
                        if not self.message_service.update_message_content(msg_id, error_payload, scheduled_time=datetime.now().timestamp()):
                            logger.error(f"Failed to update message with error content for {user_id}")

        except Exception as e:
            logger.error(f"Producer error: {str(e)}")
        finally:
            db.close()

    async def consume_messages_async(self):
        """Async logic for processing and sending messages"""
        try:
            # Get pending messages using the service
            messages = self.message_service.get_pending_messages()
            for message in messages:
                logger.info(f"Processing message {message.id}")
                try:
                    # Send the message
                    success = await self.message_service.send_user_message(
                        message.email, message.payload
                    )

                    if success:
                        # Mark as sent using the service
                        self.message_service.mark_message_sent(message.id)
                        logger.info(f"Message sent successfully to {message.phone}")
                    else:
                        logger.error(f"Failed to send message to {message.email}")

                except Exception as e:
                    logger.error(f"Error processing message {message.id}: {str(e)}")

        except Exception as e:
            logger.error(f"Async consumer error: {str(e)}")