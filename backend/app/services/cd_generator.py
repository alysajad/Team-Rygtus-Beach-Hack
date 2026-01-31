class CDWorkflowGenerator:
    def generate_aks_cd(self, acr_name: str, aks_cluster: str, resource_group: str, branch: str = "main", stack: dict = None) -> str:
        """
        Generates a GitHub Actions workflow for building a Docker image and deploying to AKS.
        Assuming strict usage of GitHub Secrets: AZURE_CREDENTIALS, ACR_NAME, AKS_CLUSTER, RESOURCE_GROUP
        """
        
        # Check if Dockerfile exists
        has_dockerfile = stack.get("has_dockerfile", False) if stack else True
        dockerfile_step = ""
        
        if not has_dockerfile:
            # Auto-generate a simple Dockerfile based on language
            language = stack.get("language") if stack else "unknown"
            
            if language == "javascript" or stack.get("framework") == "node":
                dockerfile_content = """FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [\\"npm\\", \\"start\\"]"""
            elif language == "python":
                dockerfile_content = """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD [\\"python\\", \\"app/main.py\\"]""" # Best guess
            else:
                 # Fallback generic
                dockerfile_content = """FROM alpine:latest
CMD [\\"echo\\", \\"No specific language detected for Dockerfile\\"]"""

            dockerfile_content_indented = dockerfile_content.replace("\n", "\n          ")
            dockerfile_step = f"""
      - name: Create Default Dockerfile
        run: |
          cat <<EOF > Dockerfile
          {dockerfile_content_indented}
          EOF
"""

        workflow_content = f"""name: AKS CD Pipeline

on:
  push:
    branches: ["main", "master"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps: 
      - uses: actions/checkout@v4
{dockerfile_step}
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{{{ secrets.AZURE_CREDENTIALS }}}}

      - name: Login to ACR
        run: az acr login --name ${{{{ secrets.ACR_NAME }}}}

      - name: Build Docker Image
        run: |
          docker build -t ${{{{ secrets.ACR_NAME }}}}.azurecr.io/app:latest .

      - name: Push Docker Image
        run: |
          docker push ${{{{ secrets.ACR_NAME }}}}.azurecr.io/app:latest

      - name: Get AKS Credentials
        run: |
          az aks get-credentials \\
            --resource-group ${{{{ secrets.RESOURCE_GROUP }}}} \\
            --name ${{{{ secrets.AKS_CLUSTER }}}} \\
            --overwrite-existing

      - name: Deploy to AKS
        run: |
          # Create a simple deployment if not exists (Hackathon shortcut)
          # In real world, we'd use Helm or existing manifests
          kubectl create deployment app --image=${{{{ secrets.ACR_NAME }}}}.azurecr.io/app:latest --dry-run=client -o yaml > deployment.yaml
          kubectl apply -f deployment.yaml
          
          # Force restart to pick up new image
          kubectl rollout restart deployment/app
"""
        return workflow_content
