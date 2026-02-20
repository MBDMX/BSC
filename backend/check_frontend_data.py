import requests
import json

def check_frontend_data():
    base_url = "http://localhost:8000"
    
    # Need to start server first!
    # I'll just check the DB functions since server is off for now.
    import sqlite3
    conn = sqlite3.connect('burger_stock.db')
    cursor = conn.cursor()
    
    # 1. Total consumption today for all items
    cursor.execute("""
        SELECT p.nom, SUM(sh.qty_out) 
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        WHERE DATE(sh.date) = DATE('now')
        GROUP BY p.id
    """)
    rows = cursor.fetchall()
    print("Consumption Today (as per SQL for Analytics):")
    for row in rows:
        print(f"  {row[0]}: {row[1]}")
    
    # 2. Check quantities in products table
    cursor.execute("SELECT nom, quantite FROM products WHERE id IN (1, 3)")
    rows = cursor.fetchall()
    print("\nStock Master Quantities:")
    for row in rows:
        print(f"  {row[0]}: {row[1]}")
        
    conn.close()

if __name__ == "__main__":
    check_frontend_data()
