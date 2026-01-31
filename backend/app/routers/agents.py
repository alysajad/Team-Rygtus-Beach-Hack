from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from app.services.prometheus_ingestion import prometheus_service
from app.services.normalization import normalization_service
from app.services.agent_input import agent_input_service

router = APIRouter(
    prefix="/agents",
    tags=["Agents"]
)

@router.get("/input/prometheus")
def get_agent_input_prometheus(url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")):
    """
    Returns high-level signals for AI agents, including trends.
    """
    try:
        target_url = url if url else "http://demo.robustperception.io:9090/metrics"
        
        # Pipeline: Fetch -> Parse -> Normalize -> Agent Signal
        raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
        raw_metrics = prometheus_service.parse_metrics(raw_text)
        normalized = normalization_service.normalize_metrics(raw_metrics)
        agent_input = agent_input_service.build_agent_signals(normalized)
        
        return agent_input
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def get_health_agent_analysis(url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")):
    """
    Evaluates system health using the Health Agent rules.
    """
    try:
        from app.services.health_agent import health_agent
        
        target_url = url if url else "http://demo.robustperception.io:9090/metrics"
        
        # Pipeline: Fetch -> Parse -> Normalize -> Health Check
        raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
        raw_metrics = prometheus_service.parse_metrics(raw_text)
        normalized = normalization_service.normalize_metrics(raw_metrics)
        
        health_report = health_agent.evaluate_health(normalized)
        return health_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
