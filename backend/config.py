import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # OpenAI Configuration
    openai_api_key: str = ""
    
    # Application Configuration
    app_env: str = "development"
    log_level: str = "INFO"
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS Configuration
    allowed_origins: List[str] = ["*"]
    
    # OpenAI Model Configuration
    default_model: str = "gpt-4.1"
    default_temperature: float = 1.0
    default_max_tokens: int = 2048
    default_top_p: float = 1.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings() 