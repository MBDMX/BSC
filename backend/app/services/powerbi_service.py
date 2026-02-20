import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
from msal import ConfidentialClientApplication
import pandas as pd
import numpy as np
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

from ..models.analytics_models import PowerBIDashboard, KPIMetrics

class PowerBIService:
    def __init__(self):
        # Configuration Power BI (à remplacer par vos vraies credentials)
        self.client_id = os.getenv("POWERBI_CLIENT_ID", "your_client_id")
        self.client_secret = os.getenv("POWERBI_CLIENT_SECRET", "your_client_secret")
        self.tenant_id = os.getenv("POWERBI_TENANT_ID", "your_tenant_id")
        self.workspace_id = os.getenv("POWERBI_WORKSPACE_ID", "your_workspace_id")
        self.dataset_id = os.getenv("POWERBI_DATASET_ID", "your_dataset_id")
        
        # Vérifier si les credentials sont configurés
        self.is_configured = all([
            self.client_id != "your_client_id",
            self.client_secret != "your_client_secret", 
            self.tenant_id != "your_tenant_id",
            self.workspace_id != "your_workspace_id",
            self.dataset_id != "your_dataset_id"
        ])
        
        # Initialisation du client MSAL seulement si configuré
        if self.is_configured:
            try:
                self.app = ConfidentialClientApplication(
                    client_id=self.client_id,
                    client_credential=self.client_secret,
                    authority=f"https://login.microsoftonline.com/{self.tenant_id}"
                )
            except Exception as e:
                print(f"Erreur lors de l'initialisation Power BI: {e}")
                self.is_configured = False
        else:
            self.app = None
            print("Power BI non configuré - mode démonstration activé")
        
        self.access_token = None
        self.token_expires = None
        
        # Cache pour les données temps réel
        self.realtime_cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Configuration pour le streaming temps réel
        self.streaming_endpoint = os.getenv("POWERBI_STREAMING_ENDPOINT", "")
        self.streaming_dataset_id = os.getenv("POWERBI_STREAMING_DATASET_ID", "")
        
        # Pool d'exécution pour les opérations asynchrones
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    def get_access_token(self) -> str:
        """Obtient un token d'accès Power BI"""
        if not self.is_configured:
            return "demo_token"
            
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token
        
        # Scopes pour Power BI
        scopes = ["https://analysis.windows.net/powerbi/api/.default"]
        
        # Obtention du token
        result = self.app.acquire_token_for_client(scopes=scopes)
        
        if "access_token" in result:
            self.access_token = result["access_token"]
            self.token_expires = datetime.now() + timedelta(seconds=result.get("expires_in", 3600))
            return self.access_token
        else:
            raise Exception(f"Erreur d'authentification Power BI: {result.get('error_description', 'Unknown error')}")
    
    def create_dashboard_embed_url(self, dashboard_id: str) -> str:
        """Crée une URL d'embed pour un dashboard Power BI"""
        try:
            token = self.get_access_token()
            
            # URL pour obtenir les informations du dashboard
            url = f"https://api.powerbi.com/v1.0/myorg/dashboards/{dashboard_id}"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            dashboard_info = response.json()
            
            # Créer l'URL d'embed avec paramètres avancés
            embed_url = f"https://app.powerbi.com/view?r=eyJrIjoi{dashboard_id},IiwidCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImMiOjh9"
            
            # Ajouter des paramètres pour l'interactivité
            embed_url += "&config=eyJjb21tYW5kQmFyIjp7InNob3dDb21tYW5kQmFyIjp0cnVlfX0%3d"
            
            return embed_url
            
        except Exception as e:
            print(f"Erreur lors de la création de l'URL d'embed: {e}")
            # URL de fallback pour démonstration
            return f"https://app.powerbi.com/demo/dashboard/{dashboard_id}"
    
    def refresh_dataset(self, dataset_id: str = None) -> Dict[str, Any]:
        """Rafraîchit un dataset Power BI"""
        try:
            token = self.get_access_token()
            dataset_id = dataset_id or self.dataset_id
            
            url = f"https://api.powerbi.com/v1.0/myorg/datasets/{dataset_id}/refreshes"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Déclencher un refresh
            response = requests.post(url, headers=headers)
            response.raise_for_status()
            
            return {
                "status": "success",
                "message": "Dataset rafraîchi avec succès",
                "refresh_id": response.json().get("id"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors du rafraîchissement: {e}",
                "timestamp": datetime.now().isoformat()
            }
    
    def push_data_to_powerbi(self, data: Dict[str, Any], table_name: str = "StockData") -> Dict[str, Any]:
        """Pousse des données vers Power BI via l'API REST"""
        if not self.is_configured:
            # Mode démonstration
            return {
                "status": "success",
                "message": "Mode démonstration - données simulées",
                "rows_count": len(data.get("products", [])),
                "timestamp": datetime.now().isoformat(),
                "demo_mode": True
            }
            
        try:
            token = self.get_access_token()
            
            # Préparation des données enrichies pour Power BI
            rows = []
            for product in data.get("products", []):
                # Calculs avancés pour Power BI
                total_value = product.get("quantite", 0) * product.get("cout_unitaire", 0)
                stock_ratio = product.get("quantite", 0) / product.get("seuil", 1) if product.get("seuil", 0) > 0 else 0
                stockout_risk = max(0, (product.get("seuil", 0) - product.get("quantite", 0)) / product.get("seuil", 1) * 100) if product.get("seuil", 0) > 0 else 0
                
                rows.append({
                    "ProductID": product.get("id"),
                    "ProductName": product.get("nom"),
                    "Quantity": product.get("quantite"),
                    "UnitCost": product.get("cout_unitaire"),
                    "Threshold": product.get("seuil"),
                    "Supplier": product.get("fournisseur"),
                    "ExpirationDate": product.get("date_peremption"),
                    "Timestamp": datetime.now().isoformat(),
                    "TotalValue": total_value,
                    "StockRatio": stock_ratio,
                    "StockoutRisk": stockout_risk,
                    "Category": self._categorize_product(product),
                    "Priority": self._calculate_priority(product),
                    "LastUpdated": datetime.now().isoformat()
                })
            
            # URL pour pousser les données
            url = f"https://api.powerbi.com/v1.0/myorg/datasets/{self.dataset_id}/tables/{table_name}/rows"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            payload = {"rows": rows}
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            return {
                "status": "success",
                "message": f"{len(rows)} lignes poussées vers Power BI",
                "rows_count": len(rows),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors du push des données: {e}",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_dashboard_data(self, dashboard_id: str) -> Dict[str, Any]:
        """Récupère les données d'un dashboard Power BI"""
        try:
            token = self.get_access_token()
            
            # URL pour obtenir les tuiles du dashboard
            url = f"https://api.powerbi.com/v1.0/myorg/dashboards/{dashboard_id}/tiles"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            tiles = response.json().get("value", [])
            
            # Récupérer les données de chaque tuile
            tile_data = []
            for tile in tiles:
                tile_id = tile.get("id")
                if tile_id:
                    tile_url = f"https://api.powerbi.com/v1.0/myorg/dashboards/{dashboard_id}/tiles/{tile_id}/data"
                    tile_response = requests.get(tile_url, headers=headers)
                    if tile_response.status_code == 200:
                        tile_data.append({
                            "tile_id": tile_id,
                            "title": tile.get("title"),
                            "data": tile_response.json()
                        })
            
            return {
                "dashboard_id": dashboard_id,
                "tiles_count": len(tiles),
                "tiles_data": tile_data,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors de la récupération des données: {e}",
                "timestamp": datetime.now().isoformat()
            }
    
    def create_kpi_dashboard(self, kpis: KPIMetrics) -> PowerBIDashboard:
        """Crée un dashboard Power BI avec les KPIs avancés"""
        try:
            # Génération d'un ID de dashboard unique
            dashboard_id = f"kpi_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Création des données pour le dashboard
            dashboard_data = {
                "kpis": {
                    "total_revenue": kpis.total_revenue,
                    "gross_profit": kpis.gross_profit,
                    "profit_margin": kpis.profit_margin,
                    "stock_turnover": kpis.stock_turnover,
                    "stockout_rate": kpis.stockout_rate,
                    "customer_satisfaction": kpis.customer_satisfaction
                },
                "roi_analysis": kpis.roi_per_product,
                "timestamp": datetime.now().isoformat()
            }
            
            # Création de l'URL d'embed
            embed_url = self.create_dashboard_embed_url(dashboard_id)
            
            # Génération d'un token de rafraîchissement
            refresh_token = self._generate_refresh_token()
            
            return PowerBIDashboard(
                dashboard_id=dashboard_id,
                dashboard_name="KPIs Avancés - Dashboard Temps Réel",
                embed_url=embed_url,
                refresh_token=refresh_token,
                last_refresh=datetime.now(),
                datasets=[self.dataset_id]
            )
            
        except Exception as e:
            # Fallback en cas d'erreur
            return PowerBIDashboard(
                dashboard_id="demo_dashboard",
                dashboard_name="Dashboard de Démonstration",
                embed_url="https://app.powerbi.com/demo/dashboard",
                refresh_token="demo_token",
                last_refresh=datetime.now(),
                datasets=["demo_dataset"]
            )
    
    def generate_real_time_kpis(self, products: List[Dict], sales_history: List[Dict]) -> Dict[str, Any]:
        """Génère des KPIs temps réel pour Power BI"""
        try:
            # Calculs temps réel
            total_stock_value = sum(p['quantite'] * p['cout_unitaire'] for p in products)
            low_stock_products = sum(1 for p in products if p['quantite'] <= p['seuil'])
            out_of_stock_products = sum(1 for p in products if p['quantite'] == 0)
            
            # Analyse des tendances
            recent_sales = sales_history[-7:] if len(sales_history) >= 7 else sales_history
            daily_revenue = sum(s.get('revenue', 0) for s in recent_sales) / len(recent_sales) if recent_sales else 0
            
            # Prédictions ML
            stock_predictions = self._generate_stock_predictions(products)
            
            # Alertes temps réel
            realtime_alerts = self._generate_realtime_alerts(products)
            
            realtime_data = {
                "timestamp": datetime.now().isoformat(),
                "total_stock_value": total_stock_value,
                "low_stock_products": low_stock_products,
                "out_of_stock_products": out_of_stock_products,
                "daily_revenue": daily_revenue,
                "stock_predictions": stock_predictions,
                "alerts": realtime_alerts,
                "performance_metrics": {
                    "stock_efficiency": self._calculate_stock_efficiency(products),
                    "revenue_trend": self._calculate_revenue_trend(sales_history),
                    "customer_satisfaction": self._calculate_customer_satisfaction(products)
                }
            }
            
            # Mise en cache
            self.realtime_cache["latest_kpis"] = realtime_data
            self.realtime_cache["cache_time"] = datetime.now().timestamp()
            
            return realtime_data
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors de la génération des KPIs temps réel: {e}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def stream_data_to_powerbi(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Stream des données vers Power BI en temps réel"""
        try:
            if not self.streaming_endpoint:
                return {"status": "error", "message": "Endpoint de streaming non configuré"}
            
            # Préparation des données pour le streaming
            streaming_data = {
                "timestamp": datetime.now().isoformat(),
                "data": data
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.streaming_endpoint,
                    json=streaming_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        return {
                            "status": "success",
                            "message": "Données streamées avec succès",
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "status": "error",
                            "message": f"Erreur streaming: {response.status}",
                            "timestamp": datetime.now().isoformat()
                        }
                        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors du streaming: {e}",
                "timestamp": datetime.now().isoformat()
            }
    
    def create_interactive_dashboard(self, dashboard_config: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un dashboard interactif Power BI"""
        try:
            # Configuration du dashboard
            dashboard_id = f"interactive_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Création des visualisations
            visualizations = self._create_visualizations(dashboard_config)
            
            # Configuration des filtres interactifs
            filters = self._create_interactive_filters(dashboard_config)
            
            # Configuration des alertes
            alerts = self._create_dashboard_alerts(dashboard_config)
            
            dashboard_config = {
                "dashboard_id": dashboard_id,
                "name": "Dashboard Interactif - Analytics Avancés",
                "visualizations": visualizations,
                "filters": filters,
                "alerts": alerts,
                "refresh_interval": 300,  # 5 minutes
                "created_at": datetime.now().isoformat()
            }
            
            return dashboard_config
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Erreur lors de la création du dashboard: {e}",
                "timestamp": datetime.now().isoformat()
        }
    
    def export_to_excel(self, data: Dict[str, Any], filename: str = None) -> str:
        """Exporte les données vers Excel"""
        try:
            if not filename:
                filename = f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Création d'un DataFrame pandas
            df = pd.DataFrame(data.get("products", []))
            
            # Ajout de métriques calculées
            if not df.empty:
                df['total_value'] = df['quantite'] * df['cout_unitaire']
                df['stock_ratio'] = df['quantite'] / df['seuil']
                df['stockout_risk'] = np.where(
                    df['quantite'] <= df['seuil'],
                    ((df['seuil'] - df['quantite']) / df['seuil'] * 100),
                    0
                )
            
            # Export vers Excel
            excel_path = f"exports/{filename}"
            os.makedirs("exports", exist_ok=True)
            
            with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Stock_Data', index=False)
                
                # Ajout de métriques KPIs
                kpis_df = pd.DataFrame([{
                    'Metric': 'Total Revenue',
                    'Value': data.get('total_revenue', 0)
                }, {
                    'Metric': 'Gross Profit',
                    'Value': data.get('gross_profit', 0)
                }, {
                    'Metric': 'Profit Margin',
                    'Value': f"{data.get('profit_margin', 0):.2f}%"
                }])
                kpis_df.to_excel(writer, sheet_name='KPIs', index=False)
            
            return excel_path
            
        except Exception as e:
            return f"Erreur lors de l'export: {e}"
    
    # === MÉTHODES PRIVÉES ===
    
    def _categorize_product(self, product: Dict[str, Any]) -> str:
        """Catégorise un produit pour Power BI"""
        price = product.get('cout_unitaire', 0)
        
        if price < 5:
            return "Bas de gamme"
        elif price < 15:
            return "Milieu de gamme"
        else:
            return "Haut de gamme"
    
    def _calculate_priority(self, product: Dict[str, Any]) -> str:
        """Calcule la priorité d'un produit"""
        stock_ratio = product.get('quantite', 0) / product.get('seuil', 1) if product.get('seuil', 0) > 0 else 1
        
        if stock_ratio <= 0.5:
            return "Critique"
        elif stock_ratio <= 1:
            return "Élevée"
        elif stock_ratio <= 2:
            return "Normale"
        else:
            return "Faible"
    
    def _generate_refresh_token(self) -> str:
        """Génère un token de rafraîchissement"""
        import secrets
        return secrets.token_urlsafe(32)
    
    def _generate_stock_predictions(self, products: List[Dict]) -> List[Dict[str, Any]]:
        """Génère des prédictions de stock pour Power BI"""
        predictions = []
        
        for product in products:
            # Simulation de prédictions ML
            current_stock = product.get('quantite', 0)
            predicted_7d = max(0, current_stock * 0.8)
            predicted_30d = max(0, current_stock * 0.5)
            
            predictions.append({
                "product_id": product.get('id'),
                "product_name": product.get('nom'),
                "current_stock": current_stock,
                "predicted_7d": predicted_7d,
                "predicted_30d": predicted_30d,
                "stockout_risk": max(0, (product.get('seuil', 0) - predicted_7d) / product.get('seuil', 1) * 100) if product.get('seuil', 0) > 0 else 0
            })
        
        return predictions
    
    def _generate_realtime_alerts(self, products: List[Dict]) -> List[Dict[str, Any]]:
        """Génère des alertes temps réel"""
        alerts = []
        
        for product in products:
            if product.get('quantite', 0) <= product.get('seuil', 0):
                alerts.append({
                    "type": "stockout_risk",
                    "product_name": product.get('nom'),
                    "severity": "high" if product.get('quantite', 0) == 0 else "medium",
                    "message": f"Stock faible pour {product.get('nom')}",
                    "timestamp": datetime.now().isoformat()
                })
        
        return alerts
    
    def _calculate_stock_efficiency(self, products: List[Dict]) -> float:
        """Calcule l'efficacité du stock"""
        if not products:
            return 0.0
        
        efficiency_scores = []
        for product in products:
            stock_ratio = product.get('quantite', 0) / product.get('seuil', 1) if product.get('seuil', 0) > 0 else 1
            efficiency = 1 - abs(1 - stock_ratio)  # Plus proche de 1 = plus efficace
            efficiency_scores.append(efficiency)
        
        return np.mean(efficiency_scores) * 100
    
    def _calculate_revenue_trend(self, sales_history: List[Dict]) -> float:
        """Calcule la tendance des revenus"""
        if len(sales_history) < 7:
            return 0.0
        
        recent_revenue = sum(s.get('revenue', 0) for s in sales_history[-7:])
        previous_revenue = sum(s.get('revenue', 0) for s in sales_history[-14:-7]) if len(sales_history) >= 14 else recent_revenue
        
        if previous_revenue == 0:
            return 0.0
        
        return ((recent_revenue - previous_revenue) / previous_revenue) * 100
    
    def _calculate_customer_satisfaction(self, products: List[Dict]) -> float:
        """Calcule la satisfaction client"""
        if not products:
            return 0.0
        
        available_products = sum(1 for p in products if p.get('quantite', 0) > 0)
        return (available_products / len(products)) * 100
    
    def _create_visualizations(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Crée des visualisations pour le dashboard"""
        return [
            {
                "type": "kpi_card",
                "title": "Revenus Totaux",
                "value": "total_revenue",
                "format": "currency"
            },
            {
                "type": "line_chart",
                "title": "Évolution des Stocks",
                "x_axis": "date",
                "y_axis": "stock_level"
            },
            {
                "type": "bar_chart",
                "title": "ROI par Produit",
                "x_axis": "product_name",
                "y_axis": "roi"
            },
            {
                "type": "pie_chart",
                "title": "Répartition des Stocks",
                "category": "product_category",
                "value": "stock_value"
            }
        ]
    
    def _create_interactive_filters(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Crée des filtres interactifs"""
        return [
            {
                "type": "date_range",
                "field": "timestamp",
                "default_range": "last_30_days"
            },
            {
                "type": "dropdown",
                "field": "product_category",
                "values": ["Tous", "Bas de gamme", "Milieu de gamme", "Haut de gamme"]
            },
            {
                "type": "slider",
                "field": "stockout_risk",
                "min": 0,
                "max": 100,
                "default": 50
            }
        ]
    
    def _create_dashboard_alerts(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Crée des alertes pour le dashboard"""
        return [
            {
                "condition": "stockout_risk > 70",
                "message": "Risque de rupture élevé détecté",
                "severity": "high",
                "action": "send_notification"
            },
            {
                "condition": "revenue_trend < -10",
                "message": "Baisse des revenus détectée",
                "severity": "medium",
                "action": "highlight_metric"
            },
            {
                "condition": "customer_satisfaction < 80",
                "message": "Satisfaction client en baisse",
                "severity": "medium",
                "action": "send_notification"
            }
        ] 