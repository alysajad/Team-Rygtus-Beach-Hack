from fastapi import APIRouter, Depends, Header, HTTPException
from typing import List
from app.services.github import github_client
from app.models.schemas import RepoSelectRequest

router = APIRouter()

from app.dependencies import get_token

import json
import os

# File to persist repo context across server restarts
CONTEXT_FILE = "repo_context.json"

def _load_context():
    if os.path.exists(CONTEXT_FILE):
        try:
            with open(CONTEXT_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def _save_context(data):
    with open(CONTEXT_FILE, "w") as f:
        json.dump(data, f)

# Initialize from file
token_repo_map = _load_context()

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
    _save_context(token_repo_map)
    return {"message": f"Selected repository {request.owner}/{request.repo}"}

def get_current_repo_context(token: str):
    # Reload just in case another worker updated it (though uvicorn workers for dev usually 1)
    # For efficiency we can rely on memory update + file save, but loading on miss is safer if multi-worker.
    # But for a simple hackathon app, in-memory + init-load is fine. 
    # Let's ensure we have the latest.
    current_map = _load_context()
    context = current_map.get(token)
    if not context:
        raise HTTPException(status_code=400, detail="No repository selected. Please call /repos/select first.")
    return context
