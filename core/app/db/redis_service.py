# redis_service.py

from typing import Any, Dict, List, Optional

from redis import Redis

from app.core.config.config import settings
from app.core.config.logger import logger


class RedisService:
    def __init__(self):
        self.client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def _execute(self, operation, *args, default=None, **kwargs):
        """Generic error handler for Redis operations"""
        try:
            return operation(*args, **kwargs)
        except Exception as e:
            logger.error(f"Redis error in {operation.__name__}: {e}")
            return default

    def check_connection(self) -> bool:
        return self._execute(self.client.ping, default=False)

    def add_to_sorted_set(self, set_key: str, member_key: str, score: float) -> bool:
        return self._execute(
            self.client.zadd, set_key, {member_key: score}, default=False
        )

    def get_from_sorted_set(
        self, set_key: str, min_score: float, max_score: float
    ) -> List[str]:
        return self._execute(
            self.client.zrangebyscore, set_key, min_score, max_score, default=[]
        )

    def remove_from_sorted_set(self, set_key: str, member_key: str) -> bool:
        return self._execute(self.client.zrem, set_key, member_key, default=False)

    def store_hash(self, hash_key: str, data: Dict[str, Any]) -> bool:
        return self._execute(self.client.hset, hash_key, mapping=data, default=False)

    def get_hash(self, hash_key: str) -> Dict[str, str]:
        data = self._execute(self.client.hgetall, hash_key, default={})
        return {str(k): str(v) for k, v in data.items()}

    def update_hash_field(self, hash_key: str, field: str, value: str) -> bool:
        return self._execute(self.client.hset, hash_key, field, value, default=False)

    def get_hash_field(self, hash_key: str, field: str) -> Optional[str]:
        return self._execute(self.client.hget, hash_key, field)

    def count_sorted_set_members(
        self, set_key: str, min_score: float, max_score: float
    ) -> int:
        return self._execute(
            self.client.zcount, set_key, min_score, max_score, default=0
        )

    def clean_sorted_set(self, set_key: str, max_score: float) -> bool:
        return self._execute(
            self.client.zremrangebyscore, set_key, 0, max_score, default=False
        )
