from typing import List, Dict, Any
import time

class ReliabilityAgent:
    def analyze_reliability(self, normalized_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes system reliability and predicts future risks based on current normalized metrics.
        Returns a reliability score (0.0 - 1.0) and a list of predicted risks.
        """
        risks = []
        reliability_score = 1.0
        
        # Weighted penalties
        penalty_weights = {
            "cpu": 0.3,
            "memory": 0.4, # Memory issues are often fatal (OOM)
            "disk": 0.5    # Disk full is critical
        }

        current_impact = 0.0

        for m in normalized_metrics:
            metric_name = m.get("metric")
            value = m.get("value")
            
            # Predict CPU Saturation Risk
            if metric_name == "cpu_load_1m":
                # If load is high, reliability drops
                if value > 0.7:
                    risk_prob = min(1.0, (value - 0.7) / 0.3) # Scaling 0.7->1.0 as 0->100% risk
                    risks.append({
                        "type": "CPU Saturation",
                        "probability": round(risk_prob, 2),
                        "severity": "high",
                        "prediction": "Potential service degradation within 10 minutes if load persists."
                    })
                    current_impact += risk_prob * penalty_weights["cpu"]

            # Predict OOM (Out of Memory) Risk
            elif metric_name == "memory_used_percent":
                if value > 0.75:
                    risk_prob = min(1.0, (value - 0.75) / 0.25)
                    risks.append({
                        "type": "Memory Exhaustion (OOM)",
                        "probability": round(risk_prob, 2),
                        "severity": "critical",
                        "prediction": "High likelihood of OOM Kill. Application stability at risk immediately."
                    })
                    current_impact += risk_prob * penalty_weights["memory"]

            # Predict Disk Space Exhaustion
            elif metric_name == "disk_free_percent":
                if value < 0.20:
                    # Invert logic: lower free space = higher risk
                    risk_prob = min(1.0, (0.20 - value) / 0.20)
                    risks.append({
                        "type": "Disk Exhaustion",
                        "probability": round(risk_prob, 2),
                        "severity": "critical",
                        "prediction": "Disk writes will fail soon. Log loss and DB corruption possible."
                    })
                    current_impact += risk_prob * penalty_weights["disk"]

        # Calculate final score (clamped between 0 and 1)
        reliability_score = max(0.0, 1.0 - current_impact)

        return {
            "reliability_score": round(reliability_score, 2),
            "risk_score": round((1.0 - reliability_score) * 10, 1), # Scale 0-10 for UI
            "reliability_status": "stable" if reliability_score > 0.8 else "at_risk" if reliability_score > 0.5 else "unreliable",
            "status": "success", # For common Agent interface
            "predicted_risks": risks,
            "timestamp": int(time.time())
        }

reliability_agent = ReliabilityAgent()