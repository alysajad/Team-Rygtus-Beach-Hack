import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = settings.GMAIL_USER
        self.sender_password = settings.GMAIL_APP_PASSWORD
    
    def send_alert_email(self, to_email: str, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends an alert email with formatted alert analysis.
        
        Args:
            to_email: Recipient email address
            alert_data: Alert analysis data with issue, why, suggestion
            
        Returns:
            Dict with success status and message
        """
        try:
            # Validate inputs
            if not to_email:
                raise ValueError("Recipient email is required")
            
            if not self.sender_email or not self.sender_password:
                raise ValueError("Gmail credentials not configured in .env")
            
            # Extract alert details
            issue = alert_data.get("issue", "No issue specified")
            why = alert_data.get("why", "No cause specified")
            suggestion = alert_data.get("suggestion", "No suggestion provided")
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"🔔 Alert: {issue}"
            message["From"] = self.sender_email
            message["To"] = to_email
            
            # Create HTML email body
            html_body = f"""
            <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                        .alert-box {{ padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid; }}
                        .issue {{ background: #fee; border-left-color: #dc3545; }}
                        .cause {{ background: #e7f3ff; border-left-color: #0d6efd; }}
                        .suggestion {{ background: #d1f2eb; border-left-color: #198754; }}
                        h2 {{ margin: 0 0 10px 0; font-size: 18px; }}
                        h3 {{ margin: 0 0 10px 0; font-size: 16px; }}
                        p {{ margin: 0; }}
                        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🔔 Alert Notification</h2>
                            <p>Automated alert from your monitoring system</p>
                        </div>
                        
                        <div class="alert-box issue">
                            <h3>⚠️ Issue Detected</h3>
                            <p>{issue}</p>
                        </div>
                        
                        <div class="alert-box cause">
                            <h3>💬 Root Cause</h3>
                            <p>{why}</p>
                        </div>
                        
                        <div class="alert-box suggestion">
                            <h3>🛡️ Recommended Action</h3>
                            <p>{suggestion}</p>
                        </div>
                        
                        <div class="footer">
                            <p>This is an automated alert from your workflow automation system.</p>
                            <p>Sent from: {self.sender_email}</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            # Create plain text fallback
            text_body = f"""
Alert Notification

⚠️ Issue Detected:
{issue}

💬 Root Cause:
{why}

🛡️ Recommended Action:
{suggestion}

---
This is an automated alert from your workflow automation system.
Sent from: {self.sender_email}
            """
            
            # Attach both HTML and plain text versions
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            logger.info(f"Sending alert email to {to_email}")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            logger.info(f"Alert email sent successfully to {to_email}")
            return {
                "success": True,
                "message": f"Alert email sent to {to_email}",
                "recipient": to_email
            }
            
        except Exception as e:
            logger.error(f"Failed to send alert email: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to send email: {str(e)}"
            }
    
    def send_custom_email(self, to_email: str, subject: str, body: str) -> Dict[str, Any]:
        """
        Sends a custom email with user-provided subject and body.
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            body: Email message body
            
        Returns:
            Dict with success status and message
        """
        try:
            # Validate inputs
            if not to_email:
                raise ValueError("Recipient email is required")
            
            if not subject or not body:
                raise ValueError("Subject and body are required for custom emails")
            
            if not self.sender_email or not self.sender_password:
                raise ValueError("Gmail credentials not configured in .env")
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email
            
            # Create HTML email body with similar styling to alert emails
            html_body = f"""
            <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                        .content {{ padding: 20px; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; }}
                        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                        h2 {{ margin: 0 0 10px 0; font-size: 18px; }}
                        p {{ margin: 0 0 10px 0; white-space: pre-wrap; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>📧 {subject}</h2>
                        </div>
                        
                        <div class="content">
                            <p>{body}</p>
                        </div>
                        
                        <div class="footer">
                            <p>This is an automated email from your workflow automation system.</p>
                            <p>Sent from: {self.sender_email}</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            # Create plain text fallback
            text_body = f"""
{subject}

{body}

---
This is an automated email from your workflow automation system.
Sent from: {self.sender_email}
            """
            
            # Attach both HTML and plain text versions
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            logger.info(f"Sending custom email to {to_email}")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            logger.info(f"Custom email sent successfully to {to_email}")
            return {
                "success": True,
                "message": f"Email sent to {to_email}",
                "recipient": to_email,
                "subject": subject
            }
            
        except Exception as e:
            logger.error(f"Failed to send custom email: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to send email: {str(e)}"
            }

# Singleton instance
email_service = EmailService()
