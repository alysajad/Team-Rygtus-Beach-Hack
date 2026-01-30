from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.dependencies import get_token
from app.services.secrets import GitHubSecretsService
from app.routers.repos import get_current_repo_context

router = APIRouter(prefix="/deployment", tags=["deployment"])

# In-memory store for "configured" state per user-session (token)
# For hackathon only.
DEPLOYMENT_CONFIGS = {}

class AKSConfig(BaseModel):
    owner: Optional[str] = None
    repo: Optional[str] = None
    azure_credentials: str # JSON string or whatever format Azure expects
    acr_name: str
    aks_cluster: str
    resource_group: str

@router.post("/aks/configure")
def configure_aks_deployment(config: AKSConfig, token: str = Depends(get_token)):
    """
    Configure AKS deployment by setting GitHub Secrets.
    DOES NOT STORE SECRETS LOCALLY.
    """
    secrets_service = GitHubSecretsService(token)
    
    try:
        # Get context if owner/repo not provided
        if not config.owner or not config.repo:
            context = get_current_repo_context(token)
            owner = config.owner or context["owner"]
            repo = config.repo or context["repo"]
        else:
            owner = config.owner
            repo = config.repo

        # Create secrets on GitHub
        results = secrets_service.setup_deployment_secrets(
            owner=owner,
            repo=repo,
            azure_creds=config.azure_credentials,
            acr_name=config.acr_name,
            aks_cluster=config.aks_cluster,
            resource_group=config.resource_group
        )
        
        # Mark as configured in memory so we can enable CD generation
        # We store just boolean flags or non-sensitive info
        DEPLOYMENT_CONFIGS[token] = {
            "configured": True,
            "provider": "aks",
            "acr_name": config.acr_name,
            "aks_cluster": config.aks_cluster,
            "resource_group": config.resource_group
        }
        
        return {"status": "success", "message": "Deployment secrets configured on GitHub", "details": results}
        
    except Exception as e:
        print(f"Error configuring deployment: {e}") # Print stack trace to logs
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
