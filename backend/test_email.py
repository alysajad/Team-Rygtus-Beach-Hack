#!/usr/bin/env python3
"""
Test script to verify Gmail email configuration
Run this to test if your Gmail credentials are working correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import email_service

def test_email():
    """Test sending an email"""
    print("Testing Gmail Email Service...")
    print(f"SMTP Server: {email_service.smtp_server}:{email_service.smtp_port}")
    print(f"Sender Email: {email_service.sender_email}")
    print(f"Password Set: {'Yes' if email_service.sender_password else 'No'}")
    print()
    
    # Get recipient email
    recipient = input("Enter recipient email address to test: ").strip()
    if not recipient:
        print("❌ No recipient provided")
        return
    
    # Test alert email
    print("\n📧 Sending test alert email...")
    test_alert_data = {
        "issue": "Test Alert - Email Service Verification",
        "why": "This is a test email to verify your Gmail SMTP configuration is working correctly.",
        "suggestion": "If you receive this email, your email service is configured properly!"
    }
    
    result = email_service.send_alert_email(recipient, test_alert_data)
    
    if result.get("success"):
        print(f"✅ Success! Email sent to {recipient}")
        print(f"   Message: {result.get('message')}")
    else:
        print(f"❌ Failed to send email")
        print(f"   Error: {result.get('error')}")
        print(f"   Message: {result.get('message')}")
        print("\n💡 Common issues:")
        print("   1. Invalid App Password (must be 16 characters)")
        print("   2. 2-Factor Authentication not enabled on Gmail")
        print("   3. App Password not generated from Google Account settings")
        print("   4. Network/firewall blocking SMTP port 587")

if __name__ == "__main__":
    try:
        test_email()
    except KeyboardInterrupt:
        print("\n\nTest cancelled")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
