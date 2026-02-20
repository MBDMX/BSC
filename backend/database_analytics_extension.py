
# =========== ANALYTICS AGGREGATION ===========
def get_analytics_summary():
    """Aggregate data for the analytics dashboard."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Total Revenue & Orders (Current Month)
    today = date.today()
    start_month = today.replace(day=1).strftime("%Y-%m-%d")
    
    cursor.execute("SELECT SUM(total), COUNT(*), SUM(quantite) FROM sales WHERE date >= ?", (start_month,))
    row = cursor.fetchone()
    total_revenue_month = row[0] or 0.0
    total_orders_month = row[1] or 0
    total_items_month = row[2] or 0

    # 2. Top Performing Products (All Time)
    cursor.execute("""
        SELECT produit_nom, SUM(quantite) as qty, SUM(total) as rev
        FROM sales
        GROUP BY produit_nom
        ORDER BY qty DESC
        LIMIT 5
    """)
    top_products = [{"nom": r[0], "quantite_vendue": r[1], "chiffre_affaires": r[2]} for r in cursor.fetchall()]

    # 3. Stock Alerts (Real Time)
    cursor.execute("SELECT nom, quantite, seuil FROM products WHERE quantite <= seuil")
    alerts = [{"produit": r[0], "quantite_actuelle": r[1], "seuil_minimum": r[2], "type": "critique" if r[1] <= r[2]/2 else "faible"} for r in cursor.fetchall()]

    # 4. Monthly Trends (Last 6 months)
    six_months_ago = (today - timedelta(days=180)).strftime("%Y-%m-%d")
    cursor.execute("""
        SELECT strftime('%Y-%m', date) as mois, SUM(total) as revenue, COUNT(*) as orders
        FROM sales
        WHERE date >= ?
        GROUP BY mois
        ORDER BY mois ASC
    """, (six_months_ago,))
    trends = [{"mois": r[0], "ventes": r[1], "commandes": r[2]} for r in cursor.fetchall()]
    
    # 5. Daily Sales (Last 30 days) for Chart
    thirty_days_ago = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    cursor.execute("""
        SELECT date, SUM(total) as revenue, SUM(quantite) as qty
        FROM sales
        WHERE date >= ?
        GROUP BY date
        ORDER BY date ASC
    """, (thirty_days_ago,))
    daily_sales = [{"date": r[0], "montant": r[1], "quantite": r[2]} for r in cursor.fetchall()]

    conn.close()

    return {
        "kpis": {
            "total_revenue": total_revenue_month,
            "total_orders": total_orders_month,
            "total_items": total_items_month
        },
        "top_products": top_products,
        "alerts": alerts,
        "trends": trends,
        "daily_sales": daily_sales
    }
