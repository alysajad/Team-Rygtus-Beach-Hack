from typing import List, Dict, Any, Optional
import requests
import json
import time
import os
from app.config import settings
from pathlib import Path
from dotenv import load_dotenv

# Robustly load .env from app directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Import other agents
from app.services.health_agent import health_agent
from app.services.reliability_agent import reliability_agent
from app.services.investigator_agent import investigator_agent
from app.services.alert_agent import alert_agent

class SupervisorAgent:
    def supervise(
        self, 
        selected_agents: List[str], 
        normalized_metrics: List[Dict[str, Any]], 
        log_path: str = "app.log", 
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates selected agents and synthesizes their outputs using Gemini.
        Returns a comprehensive report with an executive summary and suggestions.
        """
        
        results = {}
        
        # 1. Run Selected Agents
        # ---------------------
        if "health" in selected_agents:
            results["health_agent"] = health_agent.evaluate_health(normalized_metrics)
            
        if "reliability" in selected_agents:
            results["reliability_agent"] = reliability_agent.analyze_reliability(normalized_metrics)
            
        if "investigator" in selected_agents:
            # Investigator uses logs AND optionally metrics
            results["investigator_agent"] = investigator_agent.investigate(log_path, normalized_metrics=normalized_metrics)
            
        if "alert" in selected_agents:
            # Alert agent itself uses Gemini, but we include its output in the synthesis
            results["alert_agent"] = alert_agent.analyze_alert(normalized_metrics, api_key=api_key)

        # 2. Synthesize with Gemini
        # -------------------------
        key = os.getenv("GEMINI_API_KEY")
        
        synthesis = {
            "overview_report": "Synthesis failed or key missing.",
            "general_suggestions": []
        }

        if key:
            try:
                prompt = self._construct_synthesis_prompt(results)
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
                
                response = requests.post(url, json=payload, timeout=20)
                if response.status_code == 200:
                    text_content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                    ai_response = json.loads(text_content)
                    synthesis["overview_report"] = ai_response.get("overview", "No overview generated.")
                    synthesis["general_suggestions"] = ai_response.get("suggestions", [])
                else:
                    synthesis["error"] = f"Gemini API Error: {response.text}"
                    
            except Exception as e:
                synthesis["error"] = f"Synthesis Exception: {str(e)}"
        else:
             synthesis["warning"] = "Gemini API Key missing. Skipping AI synthesis."

        return {
            "status": "success",
            "timestamp": int(time.time()),
            "agents_run": selected_agents,
            "agent_results": results,
            "supervisor_analysis": synthesis
        }

    def _construct_synthesis_prompt(self, results: Dict[str, Any]) -> str:
        data_str = json.dumps(results, indent=2)
        return f"""
        You are a Chief Technology Supervisor AI. 
        You have received reports from various sub-agents monitoring a system.
        
        Sub-Agent Reports:
        {data_str}
        
        Your Goal:
        1. create a high-level "Overview Report" summarizing the system status. Is it healthy? At risk? Critical?
        2. Provide "General Suggestions" for the engineering team based on ALL the data (combining logs, metrics, risks).
        
        Return ONLY a JSON object with this exact structure:
        {{
            "overview": "A concise paragraph summarizing the overall state of the system.",
            "suggestions": [
                "Suggestion 1",
                "Suggestion 2",
                "..."
            ]
        }}
        """

supervisor_agent = SupervisorAgent()
