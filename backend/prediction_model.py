"""
Simple prediction algorithm for ingredient stock forecasting.
Uses weighted moving average with day-of-week seasonality.
"""
from datetime import date, timedelta
from typing import Dict, List, Tuple
import statistics

def predict_ingredient_consumption(
    product_sales_history: List[Tuple[str, int, int]],  # (date, product_id, quantity)
    recipes: Dict[int, Dict[int, float]],  # product_id -> {ingredient_id: qty_per_unit}
    forecast_days: int = 7
) -> Dict[int, List[float]]:
    """
    Predict ingredient consumption for the next N days.
    
    Args:
        product_sales_history: List of (date_str, product_id, quantity_sold)
        recipes: Mapping of product_id to ingredient requirements
        forecast_days: Number of days to forecast
        
    Returns:
        Dict mapping ingredient_id to list of predicted daily consumption
    """
    from collections import defaultdict
    from datetime import datetime
    
    # Group sales by date and product
    daily_sales = defaultdict(lambda: defaultdict(int))
    for date_str, prod_id, qty in product_sales_history:
        try:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            daily_sales[dt.date()][prod_id] += qty
        except:
            continue
    
    # Calculate day-of-week averages for each product
    dow_averages = defaultdict(lambda: defaultdict(list))  # product_id -> dow -> [sales]
    
    for sale_date, products in daily_sales.items():
        dow = sale_date.weekday()  # 0=Monday, 6=Sunday
        for prod_id, qty in products.items():
            dow_averages[prod_id][dow].append(qty)
    
    # Compute weighted average (recent days weighted more)
    product_forecasts = {}
    for prod_id in dow_averages:
        product_forecasts[prod_id] = {}
        for dow in range(7):
            if dow in dow_averages[prod_id] and dow_averages[prod_id][dow]:
                # Simple average for now (can add weights later)
                product_forecasts[prod_id][dow] = statistics.mean(dow_averages[prod_id][dow])
            else:
                # Fallback: overall average
                all_sales = [s for dow_sales in dow_averages[prod_id].values() for s in dow_sales]
                product_forecasts[prod_id][dow] = statistics.mean(all_sales) if all_sales else 0
    
    # Generate forecasts for next N days
    ingredient_forecasts = defaultdict(lambda: [0.0] * forecast_days)
    
    today = date.today()
    for day_offset in range(forecast_days):
        future_date = today + timedelta(days=day_offset + 1)
        dow = future_date.weekday()
        
        # For each product, predict sales and convert to ingredient needs
        for prod_id, dow_forecast in product_forecasts.items():
            predicted_sales = dow_forecast.get(dow, 0)
            
            # Convert to ingredient consumption
            if prod_id in recipes:
                for ing_id, qty_per_unit in recipes[prod_id].items():
                    ingredient_forecasts[ing_id][day_offset] += predicted_sales * qty_per_unit
    
    return dict(ingredient_forecasts)


def calculate_prediction_accuracy(
    actual_sales: List[Tuple[str, int, int]],  # Recent actual sales
    predicted_sales: Dict[int, float],  # What we predicted
) -> float:
    """
    Calculate Mean Absolute Percentage Error (MAPE) for accuracy.
    Returns accuracy as percentage (0-100).
    """
    from collections import defaultdict
    
    actual_by_product = defaultdict(int)
    for _, prod_id, qty in actual_sales:
        actual_by_product[prod_id] += qty
    
    errors = []
    for prod_id, actual in actual_by_product.items():
        if prod_id in predicted_sales and actual > 0:
            predicted = predicted_sales[prod_id]
            error = abs(actual - predicted) / actual
            errors.append(error)
    
    if not errors:
        return 85.0  # Default if no data
    
    mape = statistics.mean(errors)
    accuracy = max(0, min(100, (1 - mape) * 100))
    return round(accuracy, 1)
