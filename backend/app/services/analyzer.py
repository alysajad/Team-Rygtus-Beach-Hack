from app.services.github import github_client
import base64
import json

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
            "detected_files": [],
            "has_test_script": False
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
            
            # Check for test script
            self._check_node_test_script(token, owner, repo, stack_info)
            
        elif "requirements.txt" in file_names:
            stack_info["language"] = "python"
            stack_info["dependency_file"] = "requirements.txt"
            # Could read requirements.txt to check for "fastapi", "django", "flask"
            stack_info["framework"] = "python-generic"
            
        elif "pom.xml" in file_names:
            stack_info["language"] = "java"
            stack_info["framework"] = "maven"

        return stack_info

    def _check_node_test_script(self, token: str, owner: str, repo: str, stack_info: dict):
        """Helper to check if package.json has a test script."""
        try:
            pkg_data = github_client.get_repo_contents(token, owner, repo, "package.json")
            if pkg_data and "content" in pkg_data:
                content_str = base64.b64decode(pkg_data["content"]).decode("utf-8")
                pkg_json = json.loads(content_str)
                scripts = pkg_json.get("scripts", {})
                if "test" in scripts:
                    stack_info["has_test_script"] = True
        except Exception as e:
            print(f"Error checking package.json: {e}")
            # Fail safe, assume false

repo_analyzer = RepoAnalyzer()
