from typing import Dict, Any, List, Optional
import requests
import time
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AzureLogAnalyticsNode:
    """
    Azure Log Analytics Pull Node
    Authenticates via Client Credentials and pulls logs using KQL.
    """
    
    def __init__(self):
        # In-memory token cache: {(tenant_id, client_id): {'token': str, 'expires_at': float}}
        self._token_cache = {}

    def _get_access_token(self, tenant_id: str, client_id: str, client_secret: str) -> str:
        """
        Retrieves OAuth2 access token, handling caching and refresh.
        """
        cache_key = (tenant_id, client_id)
        cached = self._token_cache.get(cache_key)
        
        # Check if cached token is valid (with 5-minute buffer)
        if cached and cached['expires_at'] > time.time() + 300:
            return cached['token']

        token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        payload = {
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': 'https://api.loganalytics.io/.default'
        }
        
        try:
            resp = requests.post(token_url, data=payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            token = data['access_token']
            expires_in = int(data.get('expires_in', 3600))
            
            self._token_cache[cache_key] = {
                'token': token,
                'expires_at': time.time() + expires_in
            }
            
            return token
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to authenticate with Azure AD: {e}")
            if hasattr(e, 'response') and e.response is not None:
                raise Exception(f"Authentication Failed: {e.response.text}")
            raise Exception(f"Authentication Failed: {str(e)}")

    def _normalize_result(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Converts Azure Log Analytics 'tables' format to list of dicts.
        Structure: tables[].columns + rows[]
        """
        normalized_events = []
        
        for table in data.get('tables', []):
            columns = [col['name'] for col in table.get('columns', [])]
            rows = table.get('rows', [])
            
            # Find index of TimeGenerated if it exists (for timestamp field)
            try:
                time_idx = columns.index('TimeGenerated')
            except ValueError:
                time_idx = -1

            for row in rows:
                event = {}
                # Map columns to values
                fields = dict(zip(columns, row))
                
                # Standardized fields
                if time_idx != -1:
                    event['timestamp'] = row[time_idx]
                else:
                    event['timestamp'] = datetime.utcnow().isoformat()
                
                event['source'] = table.get('name', 'AzureLogAnalytics')
                event['fields'] = fields
                
                normalized_events.append(event)
                
        return normalized_events

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the node logic.
        
        Inputs:
            - tenant_id
            - client_id
            - client_secret
            - workspace_id
            - query
            - timespan (optional, e.g., "PT5M")
        """
        # 1. Validate Inputs
        required = ['tenant_id', 'client_id', 'client_secret', 'workspace_id', 'query']
        missing = [k for k in required if k not in inputs or not inputs[k]]
        if missing:
            raise ValueError(f"Missing required inputs: {', '.join(missing)}")

        tenant_id = inputs['tenant_id']
        client_id = inputs['client_id']
        client_secret = inputs['client_secret']
        workspace_id = inputs['workspace_id']
        query = inputs['query']
        timespan = inputs.get('timespan', 'PT5M') # Default last 5 minutes

        # 2. Authenticate
        try:
            access_token = self._get_access_token(tenant_id, client_id, client_secret)
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "step": "Authentication"
            }

        # 3. Dynamic Variable Substitution
        # Resolve {{start_time}} and {{end_time}} based on timespan
        now = datetime.utcnow()
        end_time_str = now.isoformat() + "Z"
        start_time_str = end_time_str # Default fallback

        # Simple ISO Duration Parser for PT#M, PT#H, P#D
        try:
            duration_seconds = 0
            if timespan.startswith("PT"):
                if timespan.endswith("M"):
                    duration_seconds = int(timespan[2:-1]) * 60
                elif timespan.endswith("H"):
                    duration_seconds = int(timespan[2:-1]) * 3600
            elif timespan.startswith("P") and timespan.endswith("D"):
                duration_seconds = int(timespan[1:-1]) * 86400
            
            if duration_seconds > 0:
                import datetime as dt
                start_dt = now - dt.timedelta(seconds=duration_seconds)
                start_time_str = start_dt.isoformat() + "Z"
        except Exception as e:
            logger.warning(f"Failed to parse timespan {timespan} for variable substitution: {e}")

        # Perform Substitution
        if query:
            query = query.replace("{{start_time}}", f"datetime({start_time_str})")
            query = query.replace("{{end_time}}", f"datetime({end_time_str})")

        # 4. Execute Query
        api_url = f"https://api.loganalytics.io/v1/workspaces/{workspace_id}/query"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Prefer': f'wait=600'  # Wait up to 10 minutes (API limit)
        }
        
        body = {
            "query": query,
            "timespan": timespan
        }

        try:
            response = requests.post(api_url, headers=headers, json=body, timeout=60)
            
            if response.status_code == 403:
                return {"success": False, "error": "Permission Denied (403). Check Workspace access.", "step": "Query"}
            
            response.raise_for_status()
            result_data = response.json()
            
            # 5. Normalize
            events = self._normalize_result(result_data)
            
            return {
                "success": True,
                "events": events,
                "count": len(events),
                "raw_metadata": {
                    "tables_count": len(result_data.get('tables', []))
                }
            }

        except requests.exceptions.Timeout:
            return {"success": False, "error": "Query Timed Out", "step": "Query"}
        except requests.exceptions.RequestException as e:
            error_msg = f"Query Execution Failed: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                error_msg += f" | Body: {e.response.text}"
            return {"success": False, "error": error_msg, "step": "Query"}

azure_log_analytics_service = AzureLogAnalyticsNode()
