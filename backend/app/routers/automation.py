from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class MetricsRequest(BaseModel):
    endpoint: str

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
