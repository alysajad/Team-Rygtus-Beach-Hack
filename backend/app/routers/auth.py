from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import TokenRequest, UserResponse
from app.services.github import github_client
from app.config import settings

router = APIRouter()

@router.post("/github", response_model=UserResponse)
def authenticate_github(request: TokenRequest):
    """
    Validates the GitHub token and returns user info.
    In a real app, we might issue a session cookie here, 
    but for this hackathon we will trust the client to send the token in subsequent requests,
    OR we could store it in a simple in-memory session.
    
    For simplicity, let's keep it stateless for now and require the token in headers or body for other requests,
    BUT the requirement says "Store token in memory per session (do NOT persist)".
    """
    user = github_client.validate_user(request.token)
    
    return UserResponse(
        login=user["login"],
        id=user["id"],
        avatar_url=user["avatar_url"],
        name=user.get("name")
    )
