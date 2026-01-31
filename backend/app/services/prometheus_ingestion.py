import re
from typing import List, Dict, Any

import requests

class PrometheusIngestionService:
    def fetch_prometheus_metrics(self, url: str) -> str:
        """
        Fetches raw metrics from the given Prometheus URL.
        """
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            raise Exception(f"Failed to fetch metrics from {url}: {str(e)}")

    def parse_metrics(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parses raw Prometheus text format into a structured list of dictionaries.
        This is a simple parser that doesn't require prometheus_client library.
        """
        parsed_metrics = []
        lines = raw_text.strip().split('\n')
        
        current_metric_name = None
        current_metric_type = None
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Parse HELP lines
            if line.startswith('# HELP'):
                parts = line.split(None, 3)
                if len(parts) >= 3:
                    current_metric_name = parts[2]
                continue
            
            # Parse TYPE lines
            if line.startswith('# TYPE'):
                parts = line.split(None, 3)
                if len(parts) >= 4:
                    current_metric_name = parts[2]
                    current_metric_type = parts[3]
                continue
            
            # Skip other comments
            if line.startswith('#'):
                continue
            
            # Parse metric lines
            # Format: metric_name{label="value"} value timestamp
            # or: metric_name value timestamp
            match = re.match(r'^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([0-9.eE+-]+)', line)
            if match:
                metric_name = match.group(1)
                try:
                    value = float(match.group(2))
                    parsed_metrics.append({
                        "name": metric_name,
                        "labels": {},
                        "value": value,
                        "type": current_metric_type or "unknown"
                    })
                except ValueError:
                    # Skip invalid float values
                    pass
                continue
            
            # Parse metrics with labels
            match = re.match(r'^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]+)\}\s+([0-9.eE+-]+)', line)
            if match:
                metric_name = match.group(1)
                labels_str = match.group(2)
                try:
                    value = float(match.group(3))
                    
                    # Parse labels
                    labels = {}
                    for label_pair in labels_str.split(','):
                        label_match = re.match(r'([^=]+)="([^"]*)"', label_pair.strip())
                        if label_match:
                            labels[label_match.group(1)] = label_match.group(2)
                    
                    parsed_metrics.append({
                        "name": metric_name,
                        "labels": labels,
                        "value": value,
                        "type": current_metric_type or "unknown"
                    })
                except ValueError:
                    # Skip invalid float values
                    pass
        
        return parsed_metrics

prometheus_service = PrometheusIngestionService()