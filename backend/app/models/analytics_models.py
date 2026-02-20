from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from enum import Enum

class AnomalyType(str, Enum):
    STOCKOUT = "stockout"
    THEFT = "theft"
    WASTE = "waste"
    PRICE_SPIKE = "price_spike"
    SUPPLIER_DELAY = "supplier_delay"

class PredictionType(str, Enum):
    STOCK_LEVEL = "stock_level"
    SALES_FORECAST = "sales_forecast"
    PRICE_OPTIMIZATION = "price_optimization"
    SUPPLIER_ORDER = "supplier_order"

class KPIMetrics(BaseModel):
    total_revenue: float
    total_cost: float
    gross_profit: float
    profit_margin: float
    stock_turnover: float
    stockout_rate: float
    waste_rate: float
    supplier_performance: float
    customer_satisfaction: float
    roi_per_product: Dict[str, float]

class StockPrediction(BaseModel):
    product_id: int
    product_name: str
    current_stock: float
    predicted_stock_7d: float
    predicted_stock_30d: float
    stockout_risk: float
    recommended_order: float
    confidence_level: float

class SalesForecast(BaseModel):
    date: str
    predicted_sales: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    seasonality_factor: float
    trend_factor: float

class PriceRecommendation(BaseModel):
    product_id: int
    product_name: str
    current_price: float
    recommended_price: float
    price_change_percent: float
    expected_revenue_impact: float
    competitor_analysis: Dict[str, float]
    demand_elasticity: float

class AnomalyAlert(BaseModel):
    id: str
    type: AnomalyType
    product_id: Optional[int]
    product_name: Optional[str]
    severity: str  # "low", "medium", "high", "critical"
    description: str
    detected_at: datetime
    confidence: float
    recommended_action: str
    estimated_impact: float

class SeasonalAnalysis(BaseModel):
    product_id: int
    product_name: str
    seasonal_pattern: Dict[str, float]  # month -> factor
    peak_season: str
    low_season: str
    seasonality_strength: float

class SupplierAnalytics(BaseModel):
    supplier_id: str
    supplier_name: str
    delivery_performance: float
    price_stability: float
    quality_score: float
    lead_time_avg: float
    stockout_contribution: float
    cost_impact: float

class PowerBIDashboard(BaseModel):
    dashboard_id: str
    dashboard_name: str
    embed_url: str
    refresh_token: str
    last_refresh: datetime
    datasets: List[str]

class MLModel(BaseModel):
    model_id: str
    model_type: PredictionType
    accuracy: float
    last_trained: datetime
    features_used: List[str]
    hyperparameters: Dict[str, Any]
    performance_metrics: Dict[str, float]

class BusinessInsights(BaseModel):
    top_performing_products: List[Dict[str, Any]]
    underperforming_products: List[Dict[str, Any]]
    stock_optimization_opportunities: List[Dict[str, Any]]
    pricing_opportunities: List[Dict[str, Any]]
    supplier_recommendations: List[Dict[str, Any]]
    seasonal_recommendations: List[Dict[str, Any]] 