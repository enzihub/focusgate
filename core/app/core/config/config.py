import os
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class BaseConfig(BaseSettings):
    ENVIRONMENT: str = "development"

    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # AI
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Database
    DATABASE_URL: Optional[str] = None

    # Clerk
    CLERK_SECRET_KEY: Optional[str] = None

    # Redis
    REDIS_URL: Optional[str] = None

    # Scheduler
    PRODUCE_INTERVAL_SECONDS: Optional[int] = None
    CONSUME_INTERVAL_SECONDS: Optional[int] = None

    # Email
    MAILTRAP_API_TOKEN: Optional[str] = None
    EMAIL_SUBJECT: Optional[str] = None
    FROM_EMAIL: Optional[str] = None
    FROM_NAME: Optional[str] = None

    # ScrapeOps API Configuration
    SCRAPEOPS_API_KEY: Optional[str] = None

    # Slack
    SLACK_SIGNING_SECRET: Optional[str] = None
    SLACK_BOT_TOKEN: Optional[str] = None

    # API key the web app sends in X-API-Key
    API_KEY: Optional[str] = None

    # Optional: a Slack channel that gets the team brief every morning (05:00 UTC)
    TEAM_SLACK_CHANNEL_ID: Optional[str] = None

    # Branding and links used in the email template
    LOGO_URL: Optional[str] = None
    APP_URL: Optional[str] = None

    # Error reporting (optional)
    SENTRY_DSN: Optional[str] = None

    class Config:
        env_file_encoding = "utf-8"
        case_sensitive = True


class DevelopmentConfig(BaseConfig):
    class Config:
        env_file = ".env.development"


class ProductionConfig(BaseConfig):
    class Config:
        env_file = ".env.production"


class TestConfig(BaseConfig):
    class Config:
        env_file = ".env.test"

    # Override test-specific values
    # REDIS_URL: str = "redis://localhost:6379/1"


@lru_cache()
def get_settings() -> BaseConfig:
    """
    Get configuration based on environment.
    Uses environment variable ENVIRONMENT to determine which configuration to load.
    Caches the result using lru_cache.
    """
    environment = os.getenv("ENVIRONMENT", "development")
    config_by_environment = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "test": TestConfig,
    }

    config_class = config_by_environment.get(environment, DevelopmentConfig)
    return config_class()


# Create a settings instance
settings = get_settings()
