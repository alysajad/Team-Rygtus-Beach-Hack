import requests
import json
import os
import time

BASE_URL = "http://localhost:8000"
REPO_CONTEXT_FILE = "backend/repo_context.json"

def verify_persistence():
    print("--- Verifying Repo Context Persistence ---")
    
    # 1. Mock Token
    token = "test-token-123"
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Select Repository
    print("\n1. Selecting Repository...")
    select_payload = {"owner": "test-owner", "repo": "test-repo"}
    # Note: /repos/select takes the body and token in dependency.
    # We might need to handle how the backend validates token. 
    # In dev, get_token usually just reads Authorization header.
    
    try:
        res = requests.post(f"{BASE_URL}/repos/select", json=select_payload, headers=headers)
        if res.status_code == 200:
            print("✅ Repository selected successfully.")
        else:
            print(f"❌ Failed to select repo: {res.text}")
            return
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return

    # 3. Check File
    print("\n2. Checking persistence file...")
    if os.path.exists(REPO_CONTEXT_FILE):
        print(f"✅ Context file {REPO_CONTEXT_FILE} exists.")
        with open(REPO_CONTEXT_FILE, 'r') as f:
            data = json.load(f)
            if data.get(token) == select_payload:
                print("✅ Context data matches.")
            else:
                print(f"❌ Context data mismatch: {data}")
    else:
        print(f"❌ Context file NOT found at {REPO_CONTEXT_FILE}")
        # Depending on where the server was started, it might be in root or backend/
        # My replacement script used "repo_context.json" relative to CWD of uvicorn.
        # Uvicorn CWD was backend/. So it should be backend/repo_context.json relative to root if file ops are relative to CWD.
        
    # 4. Call Suggest (which uses context)
    print("\n3. Calling /pipeline/suggest...")
    try:
        res = requests.post(f"{BASE_URL}/pipeline/suggest", headers=headers)
        if res.status_code == 200:
            print("✅ /pipeline/suggest returned 200 OK.")
            print(res.json())
        else:
            print(f"❌ /pipeline/suggest failed: {res.status_code} {res.text}")
            # Note: It might fail if repo_analyzer tries to actually reach GitHub with 'test-token-123'.
            # We expect that, but we want to confirm it got past the "400 No repository selected" check.
            if "No repository selected" not in res.text:
                 print("✅ Confirmed 'No repository selected' error is gone.")
            
    except Exception as e:
        print(f"❌ Error calling suggest: {e}")

if __name__ == "__main__":
    verify_persistence()
