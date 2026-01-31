from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
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
        target_url = url if url else "http://localhost:9090/metrics"
        
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
        
        target_url = url if url else "http://localhost:9090/metrics"
        
        try:
            # Pipeline: Fetch -> Parse -> Normalize -> Health Check
            raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
            raw_metrics = prometheus_service.parse_metrics(raw_text)
            normalized = normalization_service.normalize_metrics(raw_metrics)
        except Exception as e:
            print(f"Health Check Warning: Failed to fetch metrics: {e}")
            # Mock Data for verification/fallback
            normalized = [
                {"metric": "cpu_load_1m", "value": 0.1, "timestamp": 123},
                {"metric": "memory_used_percent", "value": 0.4, "timestamp": 123},
                {"metric": "disk_free_percent", "value": 0.5, "timestamp": 123}
            ]
        
        health_report = health_agent.evaluate_health(normalized)
        return health_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/investigate")
def investigate_logs(
    log_path: Optional[str] = Query(None, description="Path to the log file to analyze"),
    url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")
):
    """
    Analyzes logs for errors and critical issues using the Investigator Agent. 
    Also checks system health using normalized metrics if available.
    """
    try:
        from app.services.investigator_agent import investigator_agent
        
        # Default to a generic location if not provided
        target_log_path = log_path if log_path else "app.log"
        
        # Try to get metrics, but don't fail the whole investigation if metrics fail
        normalized = []
        try:
            target_url = url if url else "http://localhost:9090/metrics"
            raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
            raw_metrics = prometheus_service.parse_metrics(raw_text)
            normalized = normalization_service.normalize_metrics(raw_metrics)
        except Exception as metric_error:
            # Just log internally or ignore, we proceed with log investigation
            print(f"Warning: Could not fetch/process metrics for investigation: {metric_error}")
            normalized = []
        
        report = investigator_agent.investigate(target_log_path, normalized_metrics=normalized)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reliability")
def get_reliability_prediction(url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL")):
    """
    Predicts system reliability and future risks based on current metrics.
    """
    try:
        from app.services.reliability_agent import reliability_agent
        
        target_url = url if url else "http://localhost:9090/metrics"
        
        # Pipeline: Fetch -> Parse -> Normalize -> Reliability Prediction
        try:
            raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
            raw_metrics = prometheus_service.parse_metrics(raw_text)
            normalized = normalization_service.normalize_metrics(raw_metrics)
        except Exception as fetch_error:
            print(f"Warning: Failed to fetch metrics: {fetch_error}")
            # Fallback to Mock Data for demonstration/verification purposes
            normalized = [
                {"metric": "cpu_load_1m", "value": 0.85, "timestamp": 1234567890},
                {"metric": "memory_used_percent", "value": 0.60, "timestamp": 1234567890},
                {"metric": "disk_free_percent", "value": 0.10, "timestamp": 1234567890}
            ]
        
        reliability_report = reliability_agent.analyze_reliability(normalized)
        return reliability_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alert")
def get_alert_analysis(
    url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL"),
    key: Optional[str] = Query(None, description="Gemini API Key (optional override)")
):
    """
    Analyzes metrics using AI (Gemini) to generate alerts and suggestions.
    """
    try:
        from app.services.alert_agent import alert_agent
        
        target_url = url if url else "http://localhost:9090/metrics"
        
        # Pipeline: Fetch -> Parse -> Normalize -> AI Alert Analysis
        try:
            raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
            raw_metrics = prometheus_service.parse_metrics(raw_text)
            normalized = normalization_service.normalize_metrics(raw_metrics)
        except Exception as fetch_error:
            print(f"Warning: Failed to fetch metrics: {fetch_error}")
            # Mock data so we can still test the LLM integration if metrics fail
            normalized = [
                {"metric": "cpu_load_1m", "value": 0.95, "timestamp": 1234567890},
                {"metric": "memory_used_percent", "value": 0.88, "timestamp": 1234567890}
            ]
            
        alert_report = alert_agent.analyze_alert(normalized, api_key=key)
        return alert_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supervisor")
def run_supervisor(
    agents: List[str] = Query(..., description="List of agents to run (health, reliability, investigator, alert)"),
    url: Optional[str] = Query(None, description="Prometheus metrics endpoint URL"),
    log_path: Optional[str] = Query(None, description="Path to log file for investigator"),
    key: Optional[str] = Query(None, description="Gemini API Key override")
):
    """
    Orchestrates multiple agents and provides a synthesized AI report.
    """
    try:
        from app.services.supervisor_agent import supervisor_agent
        
        target_url = url if url else "http://localhost:9090/metrics"
        target_log = log_path if log_path else "app.log"
        
        # Centralized Metric Fetching
        try:
            raw_text = prometheus_service.fetch_prometheus_metrics(target_url)
            raw_metrics = prometheus_service.parse_metrics(raw_text)
            normalized = normalization_service.normalize_metrics(raw_metrics)
        except Exception as fetch_error:
            print(f"Supervisor Warning: Failed to fetch metrics: {fetch_error}")
            # Mock data for demonstration
            normalized = [
                {"metric": "cpu_load_1m", "value": 0.85, "timestamp": 1234567890},
                {"metric": "memory_used_percent", "value": 0.60, "timestamp": 1234567890}
            ]
            
        report = supervisor_agent.supervise(
            selected_agents=agents,
            normalized_metrics=normalized,
            log_path=target_log,
            api_key=key
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
