import requests
from fastapi import HTTPException
from app.config import settings

class GitHubClient:
    def __init__(self):
        self.base_url = settings.GITHUB_API_URL

    def exchange_code_for_token(self, code: str) -> str:
        headers = {"Accept": "application/json"}
        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        }

        response = requests.post("https://github.com/login/oauth/access_token", headers=headers, data=payload)
        response.raise_for_status()

        return response.json().get("access_token")

    def validate_user(self, token: str):
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{self.base_url}/user", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid GitHub Token")
        
        return response.json()

    def get_repos(self, token: str):
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        # Fetching all repos the user has access to (including org repos if permissions allow)
        # Using pagination might be needed for users with many repos, but for hackathon keeping it simple (default per_page=30)
        # We'll request 100 to be safe.
        response = requests.get(f"{self.base_url}/user/repos?per_page=100&sort=updated", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories")
            
        return response.json()
    
    def get_repo_contents(self, token: str, owner: str, repo: str, path: str = ""):
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 404:
            return None # File not found
        if response.status_code != 200:
            print(f"Error fetching {path}: {response.text}")
            return None
            
        return response.json()

    def create_or_update_file(self, token: str, owner: str, repo: str, path: str, message: str, content_b64: str, sha: str = None):
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        
        data = {
            "message": message,
            "content": content_b64
        }
        if sha:
            data["sha"] = sha
            
        response = requests.put(url, headers=headers, json=data)
        
        if response.status_code not in [200, 201]:
             raise HTTPException(status_code=response.status_code, detail=f"Failed to commit file: {response.text}")
             
        return response.json()

github_client = GitHubClient()
