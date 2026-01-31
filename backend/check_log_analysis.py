import requests
import json

url = "http://localhost:8000/automation/investigate-logs"

# Sample log data with a clear Python error
log_data = """
2024-05-20 10:00:01 INFO Starting server...
2024-05-20 10:00:02 ERROR Traceback (most recent call last):
  File "app/main.py", line 45, in <module>
    result = 10 / 0
ZeroDivisionError: division by zero
2024-05-20 10:00:03 INFO Server continued...
"""

payload = {"log_data": log_data}

print(f"Testing Log Analysis Endpoint: {url}")
try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n--- Response ---")
        print(json.dumps(data, indent=2))
        
        investigation = data.get("investigation", {})
        if investigation.get("ai_analysis"):
            print("\n✅ AI Analysis Triggered!")
            print(f"Message: {investigation.get('message')}")
            print(f"Errors Found: {json.dumps(investigation.get('errors'), indent=2)}")
        else:
            print("\n⚠️ AI Analysis NOT triggered (check API key or snippet extraction).")
    else:
        print(f"❌ Request Failed: {response.text}")

except Exception as e:
    print(f"❌ Script Error: {e}")
