import requests
from prometheus_client.parser import text_string_to_metric_families

class PrometheusIngestionService:
    def fetch_prometheus_metrics(self, url: str) -> str:
        """
        Fetches raw metrics from a Prometheus endpoint.
        """
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch metrics from {url}: {str(e)}")

    def parse_metrics(self, raw_text: str) -> list[dict]:
        """
        Parses raw Prometheus text format into a structured list of dictionaries.
        """
        parsed_metrics = []
        try:
            # text_string_to_metric_families returns a generator of MetricFamily objects
            for family in text_string_to_metric_families(raw_text):
                for sample in family.samples:
                    metric = {
                        "name": sample.name,
                        "labels": sample.labels,
                        "value": sample.value,
                        "type": family.type
                    }
                    parsed_metrics.append(metric)
            return parsed_metrics
        except Exception as e:
             raise Exception(f"Failed to parse metrics: {str(e)}")

prometheus_service = PrometheusIngestionService()
