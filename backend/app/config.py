from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    APP_NAME: str = "AI Literacy Workflow Guide"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
