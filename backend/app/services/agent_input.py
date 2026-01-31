from typing import Dict, List, Any

# In-memory store for previous values to detect trends
# Key: metric_name, Value: float
_last_metric_values: Dict[str, float] = {}

class AgentInputService:
    def build_agent_signals(self, normalized_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Converts normalized metrics into time-windowed signals with trend detection.
        """
        signals = []
        
        for m in normalized_metrics:
            name = m["metric"]
            value = m["value"]
            
            trend = self._detect_trend(name, value)
            
            signals.append({
                "name": name,
                "value": value,
                "trend": trend
            })
            
            # Update cache
            _last_metric_values[name] = value
            
        return {
            "source": "prometheus",
            "signals": signals,
            "window": "5m" # Hardcoded window concept for now
        }

    def _detect_trend(self, name: str, current_value: float) -> str:
        prev_value = _last_metric_values.get(name)
        
        if prev_value is None:
            return "stable" # No history
            
        # simple tolerance for float comparison
        delta = current_value - prev_value
        
        if abs(delta) < 0.0001:
            return "stable"
        elif delta > 0:
            return "increasing"
        else:
            return "decreasing"

agent_input_service = AgentInputService()
