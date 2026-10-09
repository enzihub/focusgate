import sys

from loguru import logger

# Remove default logger
logger.remove()

# Configure logging format
log_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# Add console logger
logger.add(sys.stderr, format=log_format, level="DEBUG", colorize=True)

logger = logger
