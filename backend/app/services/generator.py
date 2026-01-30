import yaml
from typing import List

class WorkflowGenerator:
    def generate_yaml(self, steps: List[str], stack_info: dict) -> str:
        """
        Generates a GitHub Actions YAML based on the ordered list of steps and stack info.
        """
        job_steps = []
        
        # Always checkout code
        if "checkout" in steps:
            job_steps.append({
                "uses": "actions/checkout@v4"
            })
            
        # Install Dependencies
        if "install_deps" in steps:
            if stack_info["language"] == "python":
                job_steps.append({
                    "name": "Set up Python",
                    "uses": "actions/setup-python@v4",
                    "with": {"python-version": "3.11"}
                })
                job_steps.append({
                    "name": "Install Dependencies",
                    "run": "pip install -r requirements.txt"
                })
            elif stack_info["language"] == "javascript":
                job_steps.append({
                    "name": "Set up Node",
                    "uses": "actions/setup-node@v4",
                    "with": {"node-version": "18"}
                })
                job_steps.append({
                    "name": "Install Dependencies",
                    "run": "npm install"
                })
                
        # Run Tests
        if "run_tests" in steps:
            if stack_info["language"] == "python":
                job_steps.append({
                    "name": "Run Tests",
                    "run": "pytest"
                })
            elif stack_info["language"] == "javascript":
                has_test = stack_info.get("has_test_script", False)
                if has_test:
                     job_steps.append({
                        "name": "Run Tests",
                        "run": "npm test"
                    })
                else:
                    # Adaptive fallback: Check at runtime if we can run tests
                    # This prevents the pipeline from failing on "missing script: test"
                    job_steps.append({
                        "name": "Run Tests (optional)",
                        "run": """if npm run | grep -q "test"; then
  npm test
else
  echo "No test script found, skipping tests"
fi"""
                    })

        # Docker Build
        if "docker_build" in steps:
            # Simple docker build
            job_steps.append({
                "name": "Build Docker Image",
                "run": "docker build -t my-app ."
            })
            
        # Docker Push (Mock - usually needs secrets)
        if "push_image" in steps:
             job_steps.append({
                "name": "Push Docker Image",
                "run": "echo 'Pushing to registry... (This needs authentication)'"
            })

                
        workflow = {
            "name": "CI Pipeline",
            "on": ["push"],
            "jobs": {
                "build": {
                    "runs-on": "ubuntu-latest",
                    "steps": job_steps
                }
            }
        }
        
        # Use simple pyyaml / ruamel to dump
        # Default pyyaml flow style might be ugly, but effective.
        return yaml.dump(workflow, sort_keys=False, default_flow_style=False)

workflow_generator = WorkflowGenerator()
