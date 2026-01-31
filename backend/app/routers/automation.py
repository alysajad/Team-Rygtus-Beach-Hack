from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
import subprocess
from app.services.prometheus_ingestion import prometheus_service
from app.services.normalization import normalization_service
from app.services.health_agent import health_agent
from app.services.investigator_agent import investigator_agent
from app.services.reliabilit_agent import reliability_agent
from app.services.alert_agent import alert_agent
from app.services.email_service import email_service

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
    except Exception as e:
        logger.warning(f"Failed to fetch real metrics from {endpoint}: {str(e)}. Using fallback MOCK metrics.")
        # Fallback Mock Data
        mock_data = """
# HELP cpu_load_1m 1 minute load average
# TYPE cpu_load_1m gauge
cpu_load_1m 0.15 1234567890

# HELP memory_used_percent Memory usage in percent
# TYPE memory_used_percent gauge
memory_used_percent 0.45 1234567890

# HELP disk_free_percent Disk free space in percent
# TYPE disk_free_percent gauge
disk_free_percent 0.55 1234567890
"""
        return {
            "success": True,
            "data": mock_data,
            "endpoint": endpoint,
            "message": "Used mock data due to fetch failure."
        }

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
        logger.info(f"Health status: {health_result['health_status']}")
        
        return {
            "success": True,
            "health_status": health_result["health_status"],
            "issues": health_result["issues"],
            "message": health_result["message"],
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

class FetchLogsRequest(BaseModel):
    lines: int = 100  # Number of log lines to fetch

@router.post("/fetch-logs")
async def fetch_system_logs(request: FetchLogsRequest):
    """
    Fetches system logs using journalctl command.
    Returns the most recent log entries.
    """
    try:
        logger.info(f"Fetching {request.lines} lines of system logs")
        
        # Try without sudo first (works for most users)
        result = subprocess.run(
            ['journalctl', '-n', str(request.lines), '--no-pager'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # If non-sudo fails, try with sudo
        if result.returncode != 0:
            logger.warning("journalctl without sudo failed, trying with sudo")
            result = subprocess.run(
                ['sudo', '-n', 'journalctl', '-n', str(request.lines), '--no-pager'],
                capture_output=True,
                text=True,
                timeout=10
            )
        
        if result.returncode != 0:
            raise Exception(f"journalctl command failed: {result.stderr}")
        
        logs = result.stdout
        logger.info(f"Successfully fetched {len(logs)} characters of logs")
        
        return {
            "success": True,
            "logs": logs,
            "lines_requested": request.lines
        }
        
    except subprocess.TimeoutExpired:
        logger.error("journalctl command timed out")
        raise HTTPException(status_code=408, detail="Log fetch timed out")
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")

class SendEmailRequest(BaseModel):
    to_email: str
    alert_data: dict = None  # Optional, for alert-based emails
    subject: str = None  # Optional, for custom emails
    body: str = None  # Optional, for custom emails

@router.post("/send-email")
async def send_alert_email(request: SendEmailRequest):
    """
    Sends email - either custom (with subject/body) or alert-based.
    """
    try:
        logger.info(f"Sending email to {request.to_email}")
        
        # Validate email
        if not request.to_email:
            raise HTTPException(status_code=400, detail="Recipient email is required")
        
        # Determine email type and send accordingly
        if request.subject and request.body:
            # Custom email mode
            logger.info("Sending custom email with subject and body")
            result = email_service.send_custom_email(
                to_email=request.to_email,
                subject=request.subject,
                body=request.body
            )
        elif request.alert_data:
            # Alert-based email mode
            logger.info("Sending alert-based email")
            result = email_service.send_alert_email(
                to_email=request.to_email,
                alert_data=request.alert_data
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either (subject and body) or alert_data must be provided"
            )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Failed to send email"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")
