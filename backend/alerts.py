"""
Alerts module for Burger Social Club
Handles email alerts when products reach critical stock levels.
"""

import os
from typing import List, Dict, Optional
from datetime import datetime

# Check if resend is available
RESEND_AVAILABLE = False
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    print("⚠️ Resend not installed. Email alerts will be disabled. Run: pip install resend")


def send_low_stock_alert(products: List[Dict], recipient_email: str, api_key: str = None) -> bool:
    """
    Send an email alert for low stock products.
    
    Args:
        products: List of products below their threshold
        recipient_email: Email address to send alert to
        api_key: Resend API key (optional, uses env var if not provided)
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    if not RESEND_AVAILABLE:
        print("❌ Cannot send email: resend library not installed")
        return False
    
    if not products:
        return False
    
    # Get API key from parameter or environment
    api_key = api_key or os.environ.get("RESEND_API_KEY")
    if not api_key:
        print("❌ Cannot send email: RESEND_API_KEY not configured")
        return False
    
    resend.api_key = api_key
    
    # Build email content
    product_list_html = ""
    for p in products:
        product_list_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{p.get('nom', 'Inconnu')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #e53e3e; font-weight: bold;">{p.get('quantite', 0)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{p.get('seuil', 50)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{p.get('fournisseur', '-')}</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background: #03224c; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .alert-badge {{ background: #e53e3e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            th {{ background: #f8f9fa; padding: 10px; text-align: left; }}
            .footer {{ background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍔 Burger Social Club</h1>
                <span class="alert-badge">⚠️ Alerte Stock</span>
            </div>
            <div class="content">
                <h2>Produits en stock faible</h2>
                <p>Les produits suivants ont atteint leur seuil critique et nécessitent un réapprovisionnement :</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Stock Actuel</th>
                            <th>Seuil</th>
                            <th>Fournisseur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {product_list_html}
                    </tbody>
                </table>
                
                <p style="margin-top: 20px; color: #666;">
                    📅 Alerte générée le {datetime.now().strftime('%d/%m/%Y à %H:%M')}
                </p>
            </div>
            <div class="footer">
                Burger Social Club - Système de gestion de stock
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "Burger Stock Alert <alerts@resend.dev>",
            "to": [recipient_email],
            "subject": f"⚠️ Alerte Stock - {len(products)} produit(s) en rupture",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        print(f"✅ Email alert sent successfully: {response}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email alert: {e}")
        return False


def check_low_stock_products(products: List[Dict]) -> List[Dict]:
    """
    Check which products are below their threshold.
    
    Returns:
        List of products that are at or below their seuil
    """
    low_stock = []
    for p in products:
        quantite = p.get("quantite", 0)
        seuil = p.get("seuil", 50)
        if quantite <= seuil:
            low_stock.append(p)
    return low_stock


def trigger_alerts_if_needed(products: List[Dict], recipient_email: str, api_key: str = None) -> Dict:
    """
    Main function to check stock and send alerts if needed.
    
    Returns:
        Dictionary with alert status and details
    """
    low_stock = check_low_stock_products(products)
    
    if not low_stock:
        return {
            "alert_triggered": False,
            "message": "All products are above threshold",
            "low_stock_count": 0
        }
    
    if not recipient_email:
        return {
            "alert_triggered": False,
            "message": "No recipient email configured",
            "low_stock_count": len(low_stock),
            "low_stock_products": [p.get("nom") for p in low_stock]
        }
    
    email_sent = send_low_stock_alert(low_stock, recipient_email, api_key)
    
    return {
        "alert_triggered": True,
        "email_sent": email_sent,
        "low_stock_count": len(low_stock),
        "low_stock_products": [p.get("nom") for p in low_stock]
    }
