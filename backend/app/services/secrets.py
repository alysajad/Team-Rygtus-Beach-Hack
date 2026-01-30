from base64 import b64encode
from nacl import encoding, public
from .github import GitHubClient

class GitHubSecretsService:
    def __init__(self, token: str):
        self.token = token
        self.client = GitHubClient()

    def _encrypt(self, public_key: str, secret_value: str) -> str:
        """Encrypt a Unicode string using the public key."""
        public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
        sealed_box = public.SealedBox(public_key)
        encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
        return b64encode(encrypted).decode("utf-8")

    def create_repo_secret(self, owner: str, repo: str, secret_name: str, secret_value: str):
        """
        Create or update a repository secret.
        1. Get the repo's public key.
        2. Encrypt the secret using LibSodium (PyNaCl).
        3. PUT the secret to GitHub.
        """
        # 1. Get Public Key
        pub_key_response = self.client.get_repo_public_key(owner, repo, self.token)
        key_id = pub_key_response["key_id"]
        key_material = pub_key_response["key"]

        # 2. Encrypt
        encrypted_value = self._encrypt(key_material, secret_value)

        # 3. Create Secret
        result = self.client.create_secret(owner, repo, secret_name, encrypted_value, key_id, self.token)
        return result

    def setup_deployment_secrets(self, owner: str, repo: str, azure_creds: str, acr_name: str, aks_cluster: str, resource_group: str):
        """Helper to set up all AKS related secrets at once."""
        secrets = {
            "AZURE_CREDENTIALS": azure_creds,
            "ACR_NAME": acr_name,
            "AKS_CLUSTER": aks_cluster,
            "RESOURCE_GROUP": resource_group
        }
        
        results = {}
        for name, value in secrets.items():
            results[name] = self.create_repo_secret(owner, repo, name, value)
            
        return results
