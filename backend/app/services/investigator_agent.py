from typing import Dict, Any, List
import os

class InvestigatorAgent:
    def investigate(self, log_path: str = "app.log", normalized_metrics: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyzes the log file for errors and critical issues.
        Returns a summary including error counts and context snippets.
        """
        issues = []
        error_count = 0
        critical_count = 0
        
        snippets = []
        
        if not os.path.exists(log_path):
            return {
                "error": f"Log file not found: {log_path}",
                "status": "failed"
            }

        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            total_lines = len(lines)
            
            # Simple window based context extraction
            # If we find an error, we take some lines before and after
            
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
                        
                    # Capture context: 2 lines before, current line, 5 lines after (for tracebacks)
                    start_idx = max(0, i - 2)
                    end_idx = min(len(lines), i + 6)
                    
                    context = lines[start_idx:end_idx]
                    snippets.append({
                        "line_number": i + 1,
                        "content": "".join(context)
                    })
                    
                    # Skip ahead to avoid overlapping snippets for the same block of errors
                    i = end_idx 
                else:
                    i += 1
            
            # Metric Analysis (similar to HealthAgent)
            metric_issues = []
            if normalized_metrics:
                for m in normalized_metrics:
                    metric_name = m.get("metric")
                    value = m.get("value")
                    
                    if metric_name == "cpu_load_1m" and value > 0.8:
                        metric_issues.append("High CPU usage (> 0.8 load)")
                    elif metric_name == "memory_used_percent" and value > 0.85:
                        metric_issues.append("High Memory usage (> 85%)")
                    elif metric_name == "disk_free_percent" and value < 0.15:
                        metric_issues.append("Low disk space (< 15% free)")

            return {
                "status": "success",
                "log_path": log_path,
                "summary": {
                    "total_lines_scanned": total_lines,
                    "error_count": error_count,
                    "critical_count": critical_count,
                    "metric_issues_count": len(metric_issues)
                },
                "metric_issues": metric_issues,
                "snippets": snippets[:10] # Limit to first 10 snippets to avoid huge payloads
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }

investigator_agent = InvestigatorAgent()