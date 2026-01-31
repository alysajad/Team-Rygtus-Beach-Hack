import requests
import json

BASE_URL = "http://localhost:8000/automation"

def verify_flow():
    print("--- Verifying Automation Flow ---")
    
    # Step 1: Fetch Metrics (expecting fallback if demo URL is down)
    print("\n1. Calling /metrics...")
    try:
        metrics_payload = {"endpoint": "http://demo.robustperception.io:9090"}
        metrics_res = requests.post(f"{BASE_URL}/metrics", json=metrics_payload, timeout=10)
        
        print(f"Status: {metrics_res.status_code}")
        if metrics_res.status_code != 200:
            print(f"❌ Failed to fetch metrics: {metrics_res.text}")
            return
            
        metrics_resp = metrics_res.json()
        metrics_data = metrics_resp.get("data")
        
        if not metrics_data:
            print("❌ No data returned in metrics response")
            print(json.dumps(metrics_resp, indent=2))
            return
            
        print("✅ Received metrics data")
        if metrics_resp.get("message"):
            print(f"Note: {metrics_resp.get('message')}")
            
    except Exception as e:
        print(f"❌ Exception calling /metrics: {e}")
        return

    # Step 2: Analyze Health
    print("\n2. Calling /analyze-health...")
    try:
        health_payload = {"metrics_data": metrics_data}
        health_res = requests.post(f"{BASE_URL}/analyze-health", json=health_payload, timeout=10)
        
        print(f"Status: {health_res.status_code}")
        if health_res.status_code == 200:
            health_data = health_res.json()
            print("✅ Health Analysis Success")
            print(json.dumps(health_data, indent=2))
        else:
            print(f"❌ Health Analysis Failed: {health_res.text}")
            
    except Exception as e:
        print(f"❌ Exception calling /analyze-health: {e}")

if __name__ == "__main__":
    verify_flow()
