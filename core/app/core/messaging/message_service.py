# message_service.py

import json
from datetime import datetime
from typing import Dict, List, Optional

from app.core.config.logger import logger
from app.core.emailing.email_service import EmailService
from app.core.messaging.message_data_model import MessageData
from app.db.redis_service import RedisService


class MessageService:
    def __init__(self, redis_service: RedisService):
        self.redis = redis_service
        self.namespace = "message"
        self.set_key = "pending_messages"

    def _get_message_key(self, user_id: str, timestamp: float) -> str:
        return f"{self.namespace}:{user_id}:{timestamp}"

    def enqueue_message(
        self, user_id: str, send_time: datetime, message_data: MessageData
    ) -> bool:
        try:
            timestamp = send_time.timestamp()
            message_key = self._get_message_key(user_id, timestamp)

            # Prepare message data with JSON serialization
            message_data = {
                "id": message_key,
                "user_id": user_id,
                "phone": message_data.phone,
                "email": message_data.email,
                "payload": json.dumps(
                    message_data.payload
                ),  # Serialize payload to JSON string
                "status": "pending",
                "scheduled_time": str(
                    message_data.scheduled_time
                ),  # Convert timestamp to string
                "error": "",
                "created_at": str(
                    datetime.now().timestamp()
                ),  # Convert timestamp to string
            }

            # Store hash and add to pending set atomically
            pipe = self.redis.client.pipeline()
            pipe.hset(message_key, mapping=message_data)
            pipe.zadd(self.set_key, {message_key: timestamp})
            pipe.execute()
            return True

        except Exception as e:
            logger.error(f"Error enqueuing message: {e}")
            return False

    def _deserialize_message_data(self, redis_data: Dict) -> Dict:
        """Helper method to deserialize Redis data"""
        if not redis_data:
            return {}

        try:
            # Create a copy to avoid modifying the original
            data = redis_data.copy()

            # Deserialize JSON payload
            if "payload" in data:
                data["payload"] = json.loads(data["payload"])

            # Convert string timestamps back to float
            if "scheduled_time" in data:
                data["scheduled_time"] = float(data["scheduled_time"])
            if "created_at" in data:
                data["created_at"] = float(data["created_at"])

            return data
        except Exception as e:
            logger.error(f"Error deserializing message data: {e}")
            return redis_data

    def get_pending_messages(self) -> List[MessageData]:
        """
        We use Redis WATCH and pipeline to atomically update the status from 'pending' to 'processing'.
        Only if we successfully claim the message (by updating its status) do we process it
        """
        try:
            current_time = datetime.now().timestamp()
            message_keys = self.redis.get_from_sorted_set(
                self.set_key,
                float("-inf"),  # Get all messages up to current time
                current_time,
            )

            messages = []
            for key in message_keys:
                # Use Redis WATCH for optimistic locking
                pipe = self.redis.client.pipeline()
                pipe.watch(key)

                # Get current message data
                raw_data = self.redis.get_hash(key)
                if raw_data and raw_data.get('status') == 'pending':
                    # Try to atomically update status to 'processing'
                    pipe.multi()
                    pipe.hset(key, 'status', 'processing')
                    try:
                        pipe.execute()
                        # Only process if we successfully claimed the message
                        deserialized_data = self._deserialize_message_data(raw_data)
                        messages.append(MessageData.from_dict(deserialized_data))
                    except:
                        # If somebody else claimed it first, skip this message
                        pipe.reset()
                        continue

                pipe.unwatch()
            return messages

        except Exception as e:
            logger.error(f"Error fetching pending messages: {e}")
            return []

    def get_user_messages(self, user_id: str) -> List[Dict]:
        """Get messages for a user using key pattern"""
        try:
            pattern = f"{self.namespace}:{user_id}:*"
            keys = self.redis.client.keys(pattern)
            messages = []
            for key in keys:
                if raw_data := self.redis.get_hash(key):
                    deserialized_data = self._deserialize_message_data(raw_data)
                    messages.append(deserialized_data)
            return messages
        except Exception as e:
            logger.error(f"Error fetching user messages: {e}")
            return []

    def mark_message_sent(self, message_key: str) -> bool:
        """Mark a message as sent and remove from pending"""
        try:
            pipe = self.redis.client.pipeline()
            pipe.hset(message_key, "status", "sent")
            pipe.zrem(self.set_key, message_key)
            pipe.execute()
            return True
        except Exception as e:
            logger.error(f"Error marking message as sent: {e}")
            return False

    async def send_user_message(self, user_channel: str, payload: Dict) -> bool:
        logger.info(f"Sending message to {user_channel}...")
        email_service = EmailService()

        body = payload["body"]
        subject = payload["subject"] if "subject" in payload else "New Message"

        success = await email_service.send_email(subject, user_channel, body)
        return success  # Return the actual success/failure status

    def get_message_data(
        self, user: Dict, message_payload: Dict, scheduled_time: float
    ) -> MessageData:
        """Create a message data payload for email and phone messages."""
        return MessageData(
            id=self._get_message_key(user["user_id"], scheduled_time),
            email=user.get("email", ""),
            phone=user.get("phone", ""),
            payload=message_payload,
            scheduled_time=scheduled_time,
        )

    def update_message_content(
        self,
        message_key: str,
        new_payload: Dict,
        scheduled_time: Optional[float] = None,
        additional_fields: Optional[Dict] = None
    ) -> bool:
        """
        Update message content and optionally other fields

        Args:
            message_key: The Redis key for the message
            new_payload: New payload content
            scheduled_time: Optional new scheduled time
            additional_fields: Optional dictionary of additional fields to update

        Returns:
            bool: True if update successful, False otherwise
        """

        # Added the scheduled_time as an optional arg because earlier we only accepted payload.
        # Easier this way other than creating a new function. But if many fields need to be supported, need a function.
        try:
            pipe = self.redis.client.pipeline()
            pipe.watch(message_key)

            # Start with payload update
            updates = {"payload": json.dumps(new_payload)}

            # Add scheduled_time update if provided
            if scheduled_time is not None:
                updates["scheduled_time"] = str(scheduled_time)
                # Update in sorted set if scheduled time changes
                pipe.zadd(self.set_key, {message_key: scheduled_time})

            # Add any additional field updates
            if additional_fields:
                updates.update(additional_fields)

            # Update all fields atomically
            pipe.multi()
            pipe.hset(message_key, mapping=updates)
            pipe.execute()
            return True

        except Exception as e:
            logger.error(f"Error updating message content: {e}")
            return False