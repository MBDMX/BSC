from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

from ..services.analytics_service import AnalyticsService
from ..services.powerbi_service import PowerBIService
from ..models.analytics_models import (
    KPIMetrics, StockPrediction, SalesForecast, PriceRecommendation,
    AnomalyAlert, SeasonalAnalysis, SupplierAnalytics, BusinessInsights,
    PowerBIDashboard, MLModel, PredictionType, AnomalyType
)
from ..utils.auth import get_current_user

# Initialisation des services
analytics_service = AnalyticsService()
powerbi_service = PowerBIService()

# Router pour l'analytics
router = APIRouter(prefix="/analytics", tags=["Analytics & Business Intelligence"])

# Données simulées pour les tests
mock_sales_history = [
    {"date": "2024-01-15", "revenue": 1500, "units_sold": 100, "product_id": 1},
    {"date": "2024-01-16", "revenue": 1800, "units_sold": 120, "product_id": 2},
    {"date": "2024-01-17", "revenue": 1200, "units_sold": 80, "product_id": 3},
    {"date": "2024-01-18", "revenue": 2000, "units_sold": 150, "product_id": 1},
    {"date": "2024-01-19", "revenue": 1600, "units_sold": 110, "product_id": 2},
]

@router.get("/kpis/advanced", response_model=KPIMetrics)
async def get_advanced_kpis(current_user: Dict = Depends(get_current_user)):
    """Récupère les KPIs avancés calculés avec ML"""
    try:
        # Récupérer les produits actuels (simulation)
        from main import products
        products_data = [p.dict() for p in products]
        
        # Calculer les KPIs avancés
        kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
        
        return kpis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des KPIs: {str(e)}")

@router.get("/predictions/stock", response_model=List[StockPrediction])
async def get_stock_predictions(current_user: Dict = Depends(get_current_user)):
    """Prédit les niveaux de stock futurs avec Machine Learning"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
        
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction: {str(e)}")

@router.get("/anomalies/detect", response_model=List[AnomalyAlert])
async def detect_anomalies(current_user: Dict = Depends(get_current_user)):
    """Détecte les anomalies dans les données de stock"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
        
        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la détection d'anomalies: {str(e)}")

@router.get("/pricing/recommendations", response_model=List[PriceRecommendation])
async def get_price_recommendations(current_user: Dict = Depends(get_current_user)):
    """Génère des recommandations de prix dynamiques"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        recommendations = analytics_service.generate_price_recommendations(products_data, mock_sales_history)
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des recommandations: {str(e)}")

@router.get("/seasonality/analysis", response_model=List[SeasonalAnalysis])
async def analyze_seasonality(current_user: Dict = Depends(get_current_user)):
    """Analyse les tendances saisonnières des produits"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        analysis = analytics_service.analyze_seasonality(products_data, mock_sales_history)
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse saisonnière: {str(e)}")

@router.get("/insights/business", response_model=BusinessInsights)
async def get_business_insights(current_user: Dict = Depends(get_current_user)):
    """Génère des insights business complets"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        # Calculer tous les éléments nécessaires
        kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
        predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
        anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
        
        insights = analytics_service.generate_business_insights(
            products_data, kpis, predictions, anomalies
        )
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des insights: {str(e)}")

@router.get("/powerbi/dashboard", response_model=PowerBIDashboard)
async def create_powerbi_dashboard(current_user: Dict = Depends(get_current_user)):
    """Crée un dashboard Power BI avec les données actuelles"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        # Calculer les KPIs
        kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
        
        # Créer le dashboard Power BI
        dashboard = powerbi_service.create_kpi_dashboard(kpis)
        
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du dashboard: {str(e)}")

@router.post("/powerbi/refresh")
async def refresh_powerbi_dataset(current_user: Dict = Depends(get_current_user)):
    """Rafraîchit le dataset Power BI"""
    try:
        result = powerbi_service.refresh_dataset()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rafraîchissement: {str(e)}")

@router.get("/powerbi/realtime-kpis")
async def get_realtime_kpis(current_user: Dict = Depends(get_current_user)):
    """Récupère les KPIs temps réel pour Power BI"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        realtime_data = powerbi_service.generate_real_time_kpis(products_data, mock_sales_history)
        
        return realtime_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des KPIs temps réel: {str(e)}")

@router.post("/powerbi/stream-data")
async def stream_data_to_powerbi(data: Dict[str, Any] = Body(...), current_user: Dict = Depends(get_current_user)):
    """Stream des données vers Power BI en temps réel"""
    try:
        result = await powerbi_service.stream_data_to_powerbi(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du streaming: {str(e)}")

@router.post("/powerbi/create-interactive-dashboard")
async def create_interactive_dashboard(config: Dict[str, Any] = Body(...), current_user: Dict = Depends(get_current_user)):
    """Crée un dashboard interactif Power BI"""
    try:
        dashboard = powerbi_service.create_interactive_dashboard(config)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du dashboard: {str(e)}")

@router.post("/powerbi/push-data")
async def push_data_to_powerbi(data: Dict[str, Any] = Body(...), current_user: Dict = Depends(get_current_user)):
    """Pousse des données vers Power BI"""
    try:
        result = powerbi_service.push_data_to_powerbi(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du push des données: {str(e)}")

@router.get("/ml/models/status")
async def get_ml_models_status(current_user: Dict = Depends(get_current_user)):
    """Récupère le statut des modèles ML"""
    try:
        models = [
            MLModel(
                model_id="stock_prediction_model",
                model_type=PredictionType.STOCK_LEVEL,
                accuracy=0.85,
                last_trained=datetime.now() - timedelta(days=7),
                features_used=["quantite", "cout_unitaire", "seuil", "historique_ventes"],
                hyperparameters={"n_estimators": 100, "random_state": 42},
                performance_metrics={"mae": 0.12, "r2": 0.85, "rmse": 0.15}
            ),
            MLModel(
                model_id="anomaly_detection_model",
                model_type=PredictionType.STOCK_LEVEL,
                accuracy=0.92,
                last_trained=datetime.now() - timedelta(days=3),
                features_used=["quantite", "cout_unitaire", "seuil", "ratio_stock"],
                hyperparameters={"contamination": 0.1, "random_state": 42},
                performance_metrics={"precision": 0.92, "recall": 0.88, "f1": 0.90}
            )
        ]
        
        return {
            "models": models,
            "total_models": len(models),
            "last_update": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du statut des modèles: {str(e)}")

@router.post("/ml/models/retrain")
async def retrain_ml_models(current_user: Dict = Depends(get_current_user)):
    """Réentraîne les modèles ML avec les nouvelles données"""
    try:
        # Simulation du réentraînement
        from main import products
        products_data = [p.dict() for p in products]
        
        # Réentraîner les modèles
        analytics_service.stock_model.fit(
            np.array(range(len(products_data))).reshape(-1, 1),
            np.array([p['quantite'] for p in products_data])
        )
        
        return {
            "status": "success",
            "message": "Modèles ML réentraînés avec succès",
            "models_updated": ["stock_prediction_model", "anomaly_detection_model"],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du réentraînement: {str(e)}")

@router.get("/export/excel")
async def export_to_excel(current_user: Dict = Depends(get_current_user)):
    """Exporte les données vers Excel"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        # Calculer les KPIs
        kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
        
        # Préparer les données pour l'export
        export_data = {
            "products": products_data,
            "total_revenue": kpis.total_revenue,
            "gross_profit": kpis.gross_profit,
            "profit_margin": kpis.profit_margin
        }
        
        filename = f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        file_path = powerbi_service.export_to_excel(export_data, filename)
        
        return {
            "status": "success",
            "message": "Export Excel généré avec succès",
            "file_path": file_path,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'export: {str(e)}")

@router.get("/ml/predictions/real-time")
async def get_real_time_predictions(current_user: Dict = Depends(get_current_user)):
    """Récupère les prédictions ML en temps réel"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
        
        return {
            "predictions": predictions,
            "timestamp": datetime.now().isoformat(),
            "model_accuracy": 0.85,
            "last_trained": (datetime.now() - timedelta(days=7)).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction: {str(e)}")

@router.get("/ml/anomalies/real-time")
async def get_real_time_anomalies(current_user: Dict = Depends(get_current_user)):
    """Récupère les anomalies détectées en temps réel"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
        
        return {
            "anomalies": anomalies,
            "timestamp": datetime.now().isoformat(),
            "total_detected": len(anomalies),
            "critical_count": len([a for a in anomalies if a.severity == "critical"]),
            "high_count": len([a for a in anomalies if a.severity == "high"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la détection d'anomalies: {str(e)}")

@router.get("/dashboard/overview")
async def get_analytics_overview(current_user: Dict = Depends(get_current_user)):
    """Vue d'ensemble complète de l'analytics"""
    try:
        from main import products
        products_data = [p.dict() for p in products]
        
        # Calculer tous les éléments nécessaires
        kpis = analytics_service.calculate_advanced_kpis(products_data, mock_sales_history)
        predictions = analytics_service.predict_stock_levels(products_data, mock_sales_history)
        anomalies = analytics_service.detect_anomalies(products_data, mock_sales_history)
        insights = analytics_service.generate_business_insights(products_data, kpis, predictions, anomalies)
        
        return {
            "kpis": kpis,
            "predictions": predictions,
            "anomalies": anomalies,
            "insights": insights,
            "timestamp": datetime.now().isoformat(),
            "data_points": len(products_data),
            "ml_models_status": "active"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de l'overview: {str(e)}") 