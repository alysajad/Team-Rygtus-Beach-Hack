import requests
import json
import os

# Ensure server is running at localhost:8000
url = "http://localhost:8000/agents/investigate"

# Log path that does not exist
params = {"log_path": "non_existent_file.log"}

print(f"Calling API: {url} with params {params}")
print("Expected behavior: Success status, no log errors (skipped), but potential metric analysis.")

try:
    response = requests.get(url, params=params, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Response Data:")
        print(json.dumps(data, indent=2))
        
        # Assertions
        assert data["status"] == "success"
        assert "message" in data
        print(f"Agent Message: {data['message']}")
        
        # We expect metric issues key to exist (even if empty list)
        assert "metric_issues" in data
        assert "metric_issues_count" in data["summary"]
        
        print("\n✅ Robust Investigator Verification SUCCESS!")
    else:
        print(f"❌ Verification FAILED: {response.text}")

except Exception as e:
    print(f"❌ Verification ERROR: {e}")
