from fastapi import APIRouter, HTTPException, Query
from app.services.prometheus_ingestion import prometheus_service
from typing import Optional

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"]
)

@router.get("/prometheus/raw")
def get_raw_prometheus_metrics(url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")):
    """
    Fetches and parses Prometheus metrics.
    If 'url' is provided, it fetches from there.
    Otherwise, it defaults to a known demo endpoint or raises an error if env var not set (for now just optional).
    """
    # We'll use a public demo for easy verification if user doesn't provide one.
    target_url = url if url else "http://demo.robustperception.io:9090/metrics"
    
    try:
        raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
        metrics = prometheus_service.parse_metrics(raw_text)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prometheus/normalized")
def get_normalized_prometheus_metrics(url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")):
    """
    Fetches, parses, AND normalizes metrics (CPU, Memory, Disk).
    """
    try:
        # Reuse raw fetch logic via imported service endpoint logic or direct call?
        # Better to reuse service directly.
        from app.services.normalization import normalization_service
        
        target_url = url if url else "http://demo.robustperception.io:9090/metrics"
        raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
        raw_metrics = prometheus_service.parse_metrics(raw_text)
        
        normalized = normalization_service.normalize_metrics(raw_metrics)
        return normalized
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
