from fastapi import APIRouter, Depends, Header, HTTPException
from typing import List
from app.services.github import github_client
from app.models.schemas import RepoSelectRequest

router = APIRouter()

# In-memory storage for selected repo context
# Map: token (acting as session ID) -> {owner, repo}
# WARNING: using token as key is not secure for production but fine for hackathon scope where we don't have session management
token_repo_map = {}

def get_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    return authorization.split(" ")[1]

@router.get("/", response_model=List[dict])
def list_repos(token: str = Depends(get_token)):
    """
    List all accessible repositories for the user.
    """
    repos = github_client.get_repos(token)
    # Simplify response for frontend
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "full_name": r["full_name"],
            "owner": r["owner"]["login"],
            "html_url": r["html_url"],
            "description": r["description"],
            "private": r["private"]
        }
        for r in repos
    ]

@router.post("/select")
def select_repository(request: RepoSelectRequest, token: str = Depends(get_token)):
    """
    Selects a repository to work on. Verify permissions (we assume if we can fetch it, needed perms are likely there, 
    or we catch it later).
    """
    # Simple verification: try to get repo info
    # We don't strictly need to call API here if we trust the list, but good to verify existence.
    # For now, just store it.
    
    token_repo_map[token] = {"owner": request.owner, "repo": request.repo}
    return {"message": f"Selected repository {request.owner}/{request.repo}"}

def get_current_repo_context(token: str):
    context = token_repo_map.get(token)
    if not context:
        raise HTTPException(status_code=400, detail="No repository selected. Please call /repos/select first.")
    return context
