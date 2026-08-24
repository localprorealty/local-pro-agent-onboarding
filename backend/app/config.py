import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # API credentials
    GROQ_API_KEY: str = Field(..., env="GROQ_API_KEY")
    GROQ_MODEL: str = Field("llama-3.3-70b-versatile", env="GROQ_MODEL")

    # CORS configuration (comma-separated string in env)
    CORS_ORIGINS: str = Field("http://localhost:5173,http://127.0.0.1:5173", env="CORS_ORIGINS")

    # NTREIS RETS credentials
    NTREIS_RETS_URL: str = Field("", env="NTREIS_RETS_URL")
    NTREIS_RETS_USERNAME: str = Field("", env="NTREIS_RETS_USERNAME")
    NTREIS_RETS_PASSWORD: str = Field("", env="NTREIS_RETS_PASSWORD")

    # Server configs
    HOST: str = Field("0.0.0.0", env="HOST")
    PORT: int = Field(8000, env="PORT")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Instantiate settings (will load from environment or .env file)
try:
    settings = Settings()
except Exception as e:
    # Fail loud if required settings are missing but allow import for helper scripts
    # and provide fallback behavior so the app startup handles it.
    print(f"Configuration validation failed: {e}")
    # We will instantiate with fallback and handle missing values during endpoint usage or application startup
    settings = None
