from pydantic_settings import BaseSettings
import os
from pathlib import Path
from dotenv import load_dotenv

# Robustly load .env from the same directory as this file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    GITHUB_API_URL: str = "https://api.github.com"
    
    # In a real app, we might need these for OAuth, but for PAT we just need the token from the request.
    # Keeping them here just in case.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GMAIL_USER: str = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/oauth/callback"
    
    class Config:
        env_file = str(env_path)
        extra = "ignore" # Ignore extra fields in .env

settings = Settings()
