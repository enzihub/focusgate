# models/message_data.py

from datetime import datetime
from typing import Any, Dict


class MessageData:
    def __init__(
        self,
        id: str,
        email: str,
        phone: str,
        payload: Dict[str, Any],
        scheduled_time: float = None,
    ):
        self.id = id
        self.email = email
        self.phone = phone
        self.payload = payload
        self.scheduled_time = scheduled_time or datetime.now().timestamp()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "scheduled_time": self.scheduled_time,
            "email": self.email,
            "phone": self.phone,
            "payload": self.payload,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MessageData":
        return cls(
            id=data.get("id", ""),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            payload=data.get("payload", {}),
            scheduled_time=data.get("scheduled_time"),
        )
