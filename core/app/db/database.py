# database.py

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config.config import settings

# Validate database URL
if not settings.DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set in environment configuration. "
        "Please check your .env.development or .env.production file."
    )
# Create SQLAlchemy engine with connection pooling settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,  # Set initial pool size
    max_overflow=10,  # Allow up to 10 connections beyond pool_size
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency function to get a database session.
    Yields:
        Session: SQLAlchemy database session
    Usage:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
