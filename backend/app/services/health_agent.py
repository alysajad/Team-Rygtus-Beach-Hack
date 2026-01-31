from typing import List, Dict, Any

class HealthAgent:
    def evaluate_health(self, normalized_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates system health based on deterministic rules:
        - CPU > 80% (0.8) -> Warning
        - Memory > 85% (0.85) -> Warning
        - Disk Free < 15% (0.15) -> Critical
        """
        issues = []
        health_status = "healthy"

        for m in normalized_metrics:
            metric_name = m["metric"]
            value = m["value"]

            # CPU Rule
            # Using 'cpu_load_1m' as proxy. If > 0.8, we consider it high.
            # Note: Load average isn't strictly %, but for this logic we treat it as 0-1 scale contextually
            # or purely based on the raw number.
            if metric_name == "cpu_load_1m":
                if value > 0.8:
                    issues.append("High CPU usage")
                    if health_status != "critical": # Don't downgrade from critical
                        health_status = "degraded"

            # Memory Rule
            if metric_name == "memory_used_percent":
                if value > 0.85:
                    issues.append("High Memory usage")
                    if health_status != "critical":
                        health_status = "degraded"

            # Disk Rule
            if metric_name == "disk_free_percent":
                if value < 0.15:
                    issues.append("Low disk space")
                    health_status = "critical" # Critical overrides degraded

        if issues:
            message = f"Issues detected: {', '.join(issues)}"
        else:
            message = "System is healthy: No anomalies detected."

        return {
            "health_status": health_status,
            "issues": issues,
            "message": message
        }

health_agent = HealthAgent()
