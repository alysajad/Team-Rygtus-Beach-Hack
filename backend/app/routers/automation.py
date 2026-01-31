from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
from app.services.prometheus_ingestion import prometheus_service
from app.services.normalization import normalization_service
from app.services.health_agent import health_agent
from app.services.investigator_agent import investigator_agent
from app.services.reliabilit_agent import reliability_agent
from app.services.alert_agent import alert_agent

router = APIRouter()
logger = logging.getLogger(__name__)

class MetricsRequest(BaseModel):
    endpoint: str

class HealthAnalysisRequest(BaseModel):
    metrics_data: str

@router.post("/metrics")
async def fetch_metrics(request: MetricsRequest):
    """
    Proxy endpoint to fetch metrics from a given endpoint.
    This avoids CORS issues by fetching server-side.
    """
    try:
        # Add http:// if not present
        endpoint = request.endpoint
        if not endpoint.startswith(('http://', 'https://')):
            endpoint = f'http://{endpoint}'
        
        # Ensure /metrics path
        if not endpoint.endswith('/metrics'):
            endpoint = f'{endpoint}/metrics'
        
        logger.info(f"Fetching metrics from: {endpoint}")
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            logger.info(f"Sending GET request to {endpoint}")
            response = await client.get(endpoint)
            logger.info(f"Received response with status: {response.status_code}")
            response.raise_for_status()
            
            data = response.text
            logger.info(f"Successfully fetched {len(data)} characters of metrics data")
            
            return {
                "success": True,
                "data": data,
                "endpoint": endpoint
            }
    except httpx.TimeoutException as e:
        logger.error(f"Timeout fetching from {endpoint}: {str(e)}")
        raise HTTPException(status_code=408, detail="Request timeout - endpoint took too long to respond")
    except httpx.ConnectError as e:
        logger.error(f"Connection error to {endpoint}: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Could not connect to {endpoint}. Please check if the endpoint is accessible.")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error from {endpoint}: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail=f"HTTP error: {e.response.status_code}")
    except Exception as e:
        logger.error(f"Unexpected error fetching from {endpoint}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")

@router.post("/analyze-health")
async def analyze_health(request: HealthAnalysisRequest):
    """
    Analyzes Prometheus metrics and returns health status.
    Uses prometheus_ingestion, normalization, and health_agent services.
    """
    try:
        logger.info("Starting health analysis")
        
        # Parse raw Prometheus metrics
        parsed_metrics = prometheus_service.parse_metrics(request.metrics_data)
        logger.info(f"Parsed {len(parsed_metrics)} metrics")
        
        # Normalize metrics
        normalized_metrics = normalization_service.normalize_metrics(parsed_metrics)
        logger.info(f"Normalized to {len(normalized_metrics)} key metrics")
        
        # Evaluate health
        health_result = health_agent.evaluate_health(normalized_metrics)
        logger.info(f"Health status: {health_result['health']}")
        
        return {
            "success": True,
            "health_status": health_result["health"],
            "issues": health_result["issues"],
            "metrics": normalized_metrics,
            "raw_metrics": request.metrics_data  # Include raw metrics for display
        }
    except Exception as e:
        logger.error(f"Error analyzing health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing health: {str(e)}")

@router.post("/investigate")
async def investigate_metrics(request: HealthAnalysisRequest):
    """
    Investigates Prometheus metrics and log files for issues.
    Uses prometheus_ingestion, normalization, and investigator_agent services.
    """
    try:
        logger.info("Starting investigation")
        
        # Parse raw Prometheus metrics
        parsed_metrics = prometheus_service.parse_metrics(request.metrics_data)
        logger.info(f"Parsed {len(parsed_metrics)} metrics")
        
        # Normalize metrics
        normalized_metrics = normalization_service.normalize_metrics(parsed_metrics)
        logger.info(f"Normalized to {len(normalized_metrics)} key metrics")
        
        # Investigate logs and metrics
        # Note: log_path is optional, defaults to "app.log" in the investigator
        investigation_result = investigator_agent.investigate(
            log_path="app.log",  # You can make this configurable
            normalized_metrics=normalized_metrics
        )
        logger.info(f"Investigation status: {investigation_result.get('status')}")
        
        return {
            "success": True,
            "investigation": investigation_result,
            "metrics": normalized_metrics,
            "raw_metrics": request.metrics_data
        }
    except Exception as e:
        logger.error(f"Error during investigation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during investigation: {str(e)}")

class LogInvestigationRequest(BaseModel):
    log_data: str

@router.post("/investigate-logs")
async def investigate_logs_directly(request: LogInvestigationRequest):
    """
    Investigates log data directly without Prometheus metrics.
    Analyzes the provided log text for errors and critical issues.
    """
    try:
        logger.info("Starting direct log investigation")
        
        # Write log data to a temporary file for investigation
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
            temp_log.write(request.log_data)
            temp_log_path = temp_log.name
        
        try:
            # Investigate the temporary log file
            investigation_result = investigator_agent.investigate(
                log_path=temp_log_path,
                normalized_metrics=None  # No metrics for direct log investigation
            )
            logger.info(f"Investigation status: {investigation_result.get('status')}")
            
            return {
                "success": True,
                "investigation": investigation_result
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_log_path):
                os.unlink(temp_log_path)
                
    except Exception as e:
        logger.error(f"Error during log investigation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during log investigation: {str(e)}")

@router.post("/analyze-reliability")
async def analyze_reliability(request: HealthAnalysisRequest):
    """
    Analyzes Prometheus metrics for reliability predictions.
    Uses prometheus_ingestion, normalization, and reliability_agent services.
    """
    try:
        logger.info("Starting reliability analysis")
        
        # Parse raw Prometheus metrics
        parsed_metrics = prometheus_service.parse_metrics(request.metrics_data)
        logger.info(f"Parsed {len(parsed_metrics)} metrics")
        
        # Normalize metrics
        normalized_metrics = normalization_service.normalize_metrics(parsed_metrics)
        logger.info(f"Normalized to {len(normalized_metrics)} key metrics")
        
        # Analyze reliability
        reliability_result = reliability_agent.analyze_reliability(normalized_metrics)
        logger.info(f"Reliability score: {reliability_result['reliability_score']}")
        
        return {
            "success": True,
            "reliability": reliability_result,
            "metrics": normalized_metrics,
            "raw_metrics": request.metrics_data
        }
    except Exception as e:
        logger.error(f"Error analyzing reliability: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing reliability: {str(e)}")

@router.post("/analyze-alert")
async def analyze_alert(request: HealthAnalysisRequest):
    """
    Analyzes Prometheus metrics using AI (Gemini) to generate alerts and suggestions.
    Uses prometheus_ingestion, normalization, and alert_agent services.
    """
    try:
        logger.info("Starting alert analysis")
        
        # Parse raw Prometheus metrics
        parsed_metrics = prometheus_service.parse_metrics(request.metrics_data)
        logger.info(f"Parsed {len(parsed_metrics)} metrics")
        
        # Normalize metrics
        normalized_metrics = normalization_service.normalize_metrics(parsed_metrics)
        logger.info(f"Normalized to {len(normalized_metrics)} key metrics")
        
        # Analyze with Alert Agent (uses Gemini AI)
        alert_result = alert_agent.analyze_alert(normalized_metrics)
        logger.info(f"Alert analysis status: {alert_result.get('status')}")
        
        return {
            "success": True,
            "alert": alert_result,
            "metrics": normalized_metrics,
            "raw_metrics": request.metrics_data
        }
    except Exception as e:
        logger.error(f"Error analyzing alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing alert: {str(e)}")
