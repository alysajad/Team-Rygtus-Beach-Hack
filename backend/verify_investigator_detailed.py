import requests
import json
import os

# Setup
url = "http://localhost:8000/agents/investigate"
test_log = os.path.abspath("backend/test_error.log")

# Create a test log file with errors at specific lines
with open(test_log, "w") as f:
    f.write("Line 1: Info\n")
    f.write("Line 2: Info\n")
    f.write("Line 3: Error: Something went wrong\n") # Line 3
    f.write("Line 4: Info\n")
    f.write("Line 5: CriticalException: System crash\n") # Line 5

try:
    print(f"Calling API: {url} with log_path='{test_log}'")
    response = requests.get(url, params={"log_path": test_log}, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        msg = data.get("message", "")
        print(f"Response Message: {msg}")
        
        # Verify Line Numbers
        if "lines: 3, 5" in msg or "lines: 3" in msg:
            print("✅ Line numbers correctly identified in message.")
        else:
            print("❌ Line numbers missing or incorrect.")
            
        print("\nFull Data:")
        print(json.dumps(data, indent=2))
    else:
        print(f"❌ Failed: {response.text}")

finally:
    # Cleanup
    if os.path.exists(test_log):
        os.remove(test_log)
