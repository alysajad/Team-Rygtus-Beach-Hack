import requests
import json

# Setup
url = "http://localhost:8000/agents/health"

print(f"Calling API: {url}")
try:
    response = requests.get(url, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        print("Response Data:")
        print(json.dumps(data, indent=2))
        
        # Verify Message Field
        if "message" in data:
            print(f"✅ Message field present: {data['message']}")
            if "healthy" in data['message'] or "Issues" in data['message']:
                 print("✅ Message content looks valid.")
            else:
                 print("⚠️ Message content unexpected.")
        else:
            print("❌ Message field MISSING.")
            
    else:
        print(f"❌ Failed: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
