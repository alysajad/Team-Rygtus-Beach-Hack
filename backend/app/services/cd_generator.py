class CDWorkflowGenerator:
    def generate_aks_cd(self, acr_name: str, aks_cluster: str, resource_group: str, branch: str = "main") -> str:
        """
        Generates a GitHub Actions workflow for building a Docker image and deploying to AKS.
        Assuming strict usage of GitHub Secrets: AZURE_CREDENTIALS, ACR_NAME, AKS_CLUSTER, RESOURCE_GROUP
        """
        
        workflow_content = f"""name: AKS CD Pipeline

on:
  push:
    branches: ["{branch}"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

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
