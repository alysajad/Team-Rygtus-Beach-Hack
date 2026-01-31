from pydantic_settings import BaseSettings
from dotenv import load_dotenv
load_dotenv()

class Settings(BaseSettings):
    GITHUB_API_URL: str = "https://api.github.com"
    
    # In a real app, we might need these for OAuth, but for PAT we just need the token from the request.
    # Keeping them here just in case.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/oauth/callback"
    
    class Config:
        env_file = ".env"

settings = Settings()
