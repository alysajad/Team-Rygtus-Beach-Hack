from typing import List, Dict, Any
import requests
import json
import time
from app.config import settings
from pathlib import Path
import os
from dotenv import load_dotenv

# Robustly load .env from app directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class AlertAgent:
    def analyze_alert(self, normalized_metrics: List[Dict[str, Any]], api_key: str = None) -> Dict[str, Any]:
        """
        Analyzes metrics using Gemini API to identify issues, causes, and suggestions.
        Returns a JSON object with {issue, cause, suggestion}.
        """
        
        # Use provided key or fallback to setting
        
        key = os.getenv("GEMINI_API_KEY")
        
        if not key:
            return {
                "error": "Gemini API key not configured.",
                "status": "failed"
            }

        prompt = self._construct_prompt(normalized_metrics)
        
        try:
            # Call Gemini API via REST to avoid dependencies
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json"
                }
            }
            
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            try:
                text_content = result["candidates"][0]["content"]["parts"][0]["text"]
                # Parse JSON string from LLM
                analysis = json.loads(text_content)
                return {
                    "status": "success",
                    "timestamp": int(time.time()),
                    "analysis": analysis
                }
            except (KeyError, IndexError, json.JSONDecodeError) as parse_err:
                return {
                    "error": f"Failed to parse model response: {str(parse_err)}",
                    "raw_response": str(result),
                    "status": "failed"
                }

        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }

    def _construct_prompt(self, metrics: List[Dict[str, Any]]) -> str:
        metrics_str = json.dumps(metrics, indent=2)
        return f"""
        You are an AI Site Reliability Engineer. Analyze the following system metrics:
        
        {metrics_str}
        
        Identify if there is any performance issue, anomaly, or risk.
        If everything looks healthy, invent a potential future optimization or risk prevention strategy.
        
        Return ONLY a JSON object with this exact structure:
        {{
            "issue": "Short description of the problem (e.g. High CPU Latency, Storage Hike, or Healthy State)",
            "why": "Explanation of the cause based on the data",
            "suggestion": "Concrete step to eradicate the issue or improve the system"
        }}
        """

alert_agent = AlertAgent()
