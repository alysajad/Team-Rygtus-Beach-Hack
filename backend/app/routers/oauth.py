from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.models.schemas import UserResponse
from app.services.github import github_client
from app.config import settings

router = APIRouter()

@router.get("/login")
def login_github():
    """
    Redirects the user to GitHub's OAuth login page.
    """
    # Force the redirect_uri to match exactly what is likely configured in GitHub for this user
    # based on their error report and request.
    redirect_uri = settings.GITHUB_REDIRECT_URI
    
    github_oauth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        "&scope=repo,workflow"
    )
    return RedirectResponse(github_oauth_url)

@router.get("/callback", response_model=UserResponse)
def github_callback(code: str):
    """
    Handles the callback from GitHub.
    Exchanges the code for a token, then fetches user info.
    """
    try:
        # 1. Exchange code for token
        token = github_client.exchange_code_for_token(code)
        
        if not token:
             raise HTTPException(status_code=400, detail="Failed to retrieve access token from GitHub")

        # 2. Validate user / Get user info
        user = github_client.validate_user(token)
        
        return UserResponse(
            login=user["login"],
            id=user["id"],
            avatar_url=user["avatar_url"],
            name=user.get("name"),
            access_token=token
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
