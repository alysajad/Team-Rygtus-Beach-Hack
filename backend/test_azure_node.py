import unittest
from unittest.mock import patch, MagicMock
from app.services.azure_log_analytics import azure_log_analytics_service
import time

class TestAzureLogAnalyticsNode(unittest.TestCase):

    def setUp(self):
        # Clear cache before each test
        azure_log_analytics_service._token_cache = {}

    @patch('requests.post')
    def test_authentication_success(self, mock_post):
        # Mock Auth Response
        mock_auth_resp = MagicMock()
        mock_auth_resp.status_code = 200
        mock_auth_resp.json.return_value = {
            "access_token": "fake_token_123",
            "expires_in": 3600
        }
        mock_post.return_value = mock_auth_resp

        token = azure_log_analytics_service._get_access_token('tenant', 'client', 'secret')
        self.assertEqual(token, "fake_token_123")
        self.assertIn(('tenant', 'client'), azure_log_analytics_service._token_cache)
        
        # Verify request parameters
        args, kwargs = mock_post.call_args
        self.assertIn("login.microsoftonline.com", args[0])
        self.assertEqual(kwargs['data']['client_id'], 'client')

    @patch('requests.post')
    def test_query_success_and_normalization(self, mock_post):
        # Mock Auth Response first (since execute calls it)
        # We can pre-populate cache to skip auth call
        azure_log_analytics_service._token_cache[('tenant', 'client')] = {
            'token': 'valid_token',
            'expires_at': time.time() + 3600
        }

        # Mock Query Response
        mock_query_resp = MagicMock()
        mock_query_resp.status_code = 200
        mock_query_resp.json.return_value = {
            "tables": [
                {
                    "name": "Heartbeat",
                    "columns": [
                        {"name": "TimeGenerated", "type": "datetime"},
                        {"name": "Computer", "type": "string"},
                        {"name": "Category", "type": "string"}
                    ],
                    "rows": [
                        ["2023-10-27T10:00:00Z", "Server1", "Direct Agent"],
                        ["2023-10-27T10:05:00Z", "Server2", "Direct Agent"]
                    ]
                }
            ]
        }
        mock_post.return_value = mock_query_resp

        inputs = {
            'tenant_id': 'tenant',
            'client_id': 'client',
            'client_secret': 'secret',
            'workspace_id': 'ws_123',
            'query': 'Heartbeat | take 2'
        }

        result = azure_log_analytics_service.execute(inputs)

        self.assertTrue(result['success'])
        self.assertEqual(len(result['events']), 2)
        
        # Check normalization
        event1 = result['events'][0]
        self.assertEqual(event1['timestamp'], "2023-10-27T10:00:00Z")
        self.assertEqual(event1['source'], "Heartbeat")
        self.assertEqual(event1['fields']['Computer'], "Server1")
        
        # Check API call headers
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer valid_token')
        self.assertIn('ws_123', args[0])

    @patch('requests.post')
    def test_error_handling(self, mock_post):
        # Pre-populate cache
        azure_log_analytics_service._token_cache[('tenant', 'client')] = {
            'token': 'valid_token',
            'expires_at': time.time() + 3600
        }

        # Mock 403 Forbidden
        mock_err_resp = MagicMock()
        mock_err_resp.status_code = 403
        mock_err_resp.text = "Forbidden"
        mock_post.return_value = mock_err_resp

        inputs = {
            'tenant_id': 'tenant',
            'client_id': 'client',
            'client_secret': 'secret',
            'workspace_id': 'ws_123',
            'query': 'Heartbeat'
        }

        result = azure_log_analytics_service.execute(inputs)
        
        self.assertFalse(result['success'])
        self.assertIn("Permission Denied", result['error'])

if __name__ == '__main__':
    unittest.main()
