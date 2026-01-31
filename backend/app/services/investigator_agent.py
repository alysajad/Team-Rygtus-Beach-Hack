from typing import Dict, Any, List
import os
import json
import time
import requests
from app.config import settings

class InvestigatorAgent:
    def investigate(self, log_path: str = "app.log", normalized_metrics: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyzes the log file for errors and critical issues using Gemini AI.
        Returns a summary including error counts and context snippets.
        """
        issues = []
        error_count = 0
        critical_count = 0
        total_lines = 0
        snippets = []
        
        try:
            if log_path and os.path.exists(log_path):
                try:
                    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        
                    total_lines = len(lines)
                    
                    # Simple window based context extraction to find error candidates
                    i = 0
                    while i < len(lines):
                        line = lines[i].strip()
                        lower_line = line.lower()
                        
                        is_error = "error" in lower_line or "exception" in lower_line or "traceback" in lower_line
                        is_critical = "critical" in lower_line
                        
                        if is_error or is_critical:
                            if is_error:
                                error_count += 1
                            if is_critical:
                                critical_count += 1
                                
                            # Capture context: 2 lines before, current line, 10 lines after (for tracebacks)
                            start_idx = max(0, i - 2)
                            end_idx = min(len(lines), i + 10)
                            
                            context = lines[start_idx:end_idx]
                            
                            # Try to find a "File ..., line ..." pattern in the context to pinpoint the code location
                            source_location = "Unknown location"
                            for c_line in context:
                                if "File \"" in c_line and ", line " in c_line:
                                    source_location = c_line.strip()
                                    break
                            
                            snippets.append({
                                "line_number": i + 1,
                                "content": "".join(context),
                                "suspected_cause_location": source_location,
                                "error_type": "Critical" if is_critical else "Error"
                            })
                            
                            # Skip ahead to avoid overlapping snippets
                            i = end_idx 
                        else:
                            i += 1
                except Exception as e:
                    print(f"Error reading log file: {e}")
            
            # --- AI Analysis ---
            if snippets:
                # If we found error snippets, use AI to analyze them
                analysis = self._analyze_with_ai(snippets)
                
                # Merge AI results with basic stats
                return {
                    "status": analysis.get("status", "warning"), # Default to warning if errors found
                    "message": analysis.get("message", "Errors detected in logs."),
                    "errors": analysis.get("errors", []),
                    "log_path": log_path,
                    "summary": {
                        "total_lines_scanned": total_lines,
                        "error_count": error_count,
                        "critical_count": critical_count,
                        "ai_analysis": True
                    },
                    "snippets": snippets[:5] # Return raw snippets too as backup
                }
            
            # Fallback if no errors found in logs but metrics are provided
            metric_issues = []
            if normalized_metrics:
                for m in normalized_metrics:
                    metric_name = m.get("metric")
                    value = m.get("value")
                    
                    if metric_name == "cpu_load_1m" and value > 0.8:
                        metric_issues.append("High CPU usage (> 0.8 load)")
                    elif metric_name == "memory_used_percent" and value > 0.85:
                        metric_issues.append("High Memory usage (> 85%)")

            if not snippets and not metric_issues:
                 return {
                    "status": "success",
                    "message": "No errors or anomalies found in logs or metrics.",
                    "log_path": log_path,
                    "summary": {
                        "total_lines_scanned": total_lines,
                        "error_count": 0
                    }
                }
            
            return {
                "status": "warning",
                "message": "Metric anomalies detected.",
                "metric_issues": metric_issues,
                "log_path": log_path
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }

    def _analyze_with_ai(self, snippets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calls Gemini to analyze the extracted error snippets."""
        api_key = settings.GEMINI_API_KEY
        if not api_key:
             return {
                "issue": "Errors detected (AI unavailable)",
                "why": "No API Key configured for Gemini.",
                "suggestion": "Configure GEMINI_API_KEY in .env",
                "status": "warning"
            }

        prompt = self._construct_prompt(snippets)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json"
                }
            }
            
            response = requests.post(url, json=payload, timeout=20)
            response.raise_for_status()
            result = response.json()
            
            text_content = result["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text_content)

        except Exception as e:
            print(f"AI Analysis failed: {e}")
            return {
                "issue": "Errors detected in logs",
                "why": f"AI analysis failed: {str(e)}",
                "suggestion": "Check server connectivity and API limits.",
                "status": "warning"
            }

    def _construct_prompt(self, snippets: List[Dict[str, Any]]) -> str:
        # Limit to first 3 snippets to save tokens/complexity
        snippets_text = json.dumps(snippets[:3], indent=2)
        
        return f"""
        You are a generic but expert Log Analyzer. Analyze the following error snippets extracted from server logs:

        {snippets_text}

        Your task is to summarize the error for a developer.
        
        Return a JSON object with this EXACT structure (all values are strings):
        {{
            "issue": "Issue Found: [Show the issue and the line number it occurred at]",
            "why": "Why is the issue: [Exact reasoning in 2-3 sentences with exact position of error. Analyze the full log snippet provided]",
            "suggestion": "How to overcome: [The most effective way to suppress or fix the error]"
        }}
        
        If the snippets are just noise and not real errors, return a success message in 'issue' and explain why in 'why'.
        """

investigator_agent = InvestigatorAgent()