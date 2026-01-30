from app.services.github import github_client

class RepoAnalyzer:
    def analyze(self, token: str, owner: str, repo: str) -> dict:
        """
        Scans the repository to infer the tech stack.
        Checks for root-level files like package.json, requirements.txt, Dockerfile.
        """
        # We need to list the root directory contents
        # get_repo_contents with path="" returns valid array if root exists
        contents = github_client.get_repo_contents(token, owner, repo, "")
        
        stack_info = {
            "language": "unknown",
            "framework": "unknown",
            "has_dockerfile": False,
            "dependency_file": None,
            "detected_files": []
        }
        
        if not contents or not isinstance(contents, list):
             return stack_info
             
        file_names = [item["name"] for item in contents if item["type"] == "file"]
        stack_info["detected_files"] = file_names
        
        if "Dockerfile" in file_names:
            stack_info["has_dockerfile"] = True
            
        if "package.json" in file_names:
            stack_info["language"] = "javascript" # or typescript, but good enough for now
            stack_info["dependency_file"] = "package.json"
            # Could read package.json content to check for "next", "react", "express" etc.
            # For hackathon, assuming nodejs usage.
            stack_info["framework"] = "node" 
            
        elif "requirements.txt" in file_names:
            stack_info["language"] = "python"
            stack_info["dependency_file"] = "requirements.txt"
            # Could read requirements.txt to check for "fastapi", "django", "flask"
            stack_info["framework"] = "python-generic"
            
        elif "pom.xml" in file_names:
            stack_info["language"] = "java"
            stack_info["framework"] = "maven"

        return stack_info

repo_analyzer = RepoAnalyzer()
