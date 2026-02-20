"""
Twilio SMS and Resend Email Notification Service
Sends alerts when ingredients reach critical stock levels.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Twilio and Resend libraries will be imported only if available
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False


class NotificationService:
    def __init__(self):
        # SMS Config (Twilio)
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        
        # Email Config (Resend)
        self.resend_api_key = os.getenv('RESEND_API_KEY')
        
        if TWILIO_AVAILABLE and self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.sms_enabled = True
        else:
            self.client = None
            self.sms_enabled = False
            
        if RESEND_AVAILABLE and self.resend_api_key:
            resend.api_key = self.resend_api_key
            self.email_enabled = True
        else:
            self.email_enabled = False
    
    def send_sms(self, to_number: str, message: str) -> dict:
        """Send SMS notification."""
        if not self.sms_enabled or not to_number:
            return {
                "status": "disabled",
                "error": "Twilio not configured or phone number missing."
            }
        
        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            return {
                "status": "sent",
                "message_sid": message_obj.sid,
                "to": to_number
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def send_email(self, to_email: str, subject: str, html_content: str) -> dict:
        """Send email notification via Resend."""
        if not self.email_enabled or not to_email:
            return {
                "status": "disabled",
                "error": "Resend not configured or email missing."
            }
        
        try:
            params = {
                "from": "Burger Social Club <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            email_response = resend.Emails.send(params)
            return {
                "status": "sent",
                "id": email_response['id'],
                "to": to_email
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def format_stock_alert(self, ingredient_name: str, current_stock: float, threshold: float, days_remaining: int) -> str:
        """Format a stock alert SMS message."""
        if days_remaining <= 0:
            urgency = "🚨 RUPTURE IMMINENTE"
            time_msg = "Stock épuisé ou négatif !"
        elif days_remaining < 3:
            urgency = "⚠️ ALERTE CRITIQUE"
            time_msg = f"Rupture prévue dans {days_remaining} jour(s)"
        else:
            urgency = "📦 RAPPEL STOCK"
            time_msg = f"Rupture prévue dans {days_remaining} jour(s)"
        
        message = f"{urgency}\n"
        message += f"------------------\n"
        message += f"Produit : {ingredient_name}\n"
        message += f"Stock actuel : {current_stock:.1f}\n"
        message += f"Seuil min : {threshold:.1f}\n"
        message += f"Estimation : {time_msg}\n"
        message += f"------------------\n"
        message += "Action : Veuillez passer commande rapidement pour éviter l'arrêt de production."
        
        return message

    def format_stock_email(self, ingredient_name: str, current_stock: float, threshold: float, days_remaining: int) -> dict:
        """Format a stock alert email (subject and html)."""
        if days_remaining <= 0:
            urgency = "🚨 RUPTURE IMMINENTE"
            color = "#E53E3E" # Red
        elif days_remaining < 3:
            urgency = "⚠️ ALERTE CRITIQUE"
            color = "#DD6B20" # Orange
        else:
            urgency = "📦 RAPPEL STOCK"
            color = "#3182CE" # Blue

        subject = f"{urgency} : {ingredient_name} - Burger Social Club"
        
        html = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: white;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: {color}; margin: 0; font-size: 24px;">{urgency}</h1>
                <p style="color: #64748b; margin-top: 5px;">Alerte de gestion des stocks</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid {color}; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #475569;"><strong>Produit</strong></td>
                        <td style="padding: 8px 0; text-align: right; color: #1e293b;">{ingredient_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #475569;"><strong>Stock actuel</strong></td>
                        <td style="padding: 8px 0; text-align: right; color: {color}; font-weight: bold;">{current_stock:.1f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #475569;"><strong>Seuil minimum</strong></td>
                        <td style="padding: 8px 0; text-align: right; color: #1e293b;">{threshold:.1f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #475569;"><strong>Estimation</strong></td>
                        <td style="padding: 8px 0; text-align: right; color: #1e293b;">{'Stock épuisé !' if days_remaining <= 0 else f'Rupture dans {days_remaining} jour(s)'}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #1e293b; font-weight: 500;">Action immédiate requise pour éviter une rupture de production.</p>
                <a href="http://localhost:3000/matieres-premieres" style="display: inline-block; background-color: {color}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">🛍️ Passer une commande</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            
            <div style="text-align: center; font-size: 12px; color: #94a3b8;">
                <p>Ceci est un message automatique généré par Burger Social Club Admin.</p>
                <p>&copy; 2025 Burger Social Club</p>
            </div>
        </div>
        """
        return {"subject": subject, "html": html}


# Global instance
notification_service = NotificationService()
