import sqlite3
import json

def audit():
    conn = sqlite3.connect('burger_stock.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- SALES TODAY ---")
    cursor.execute("SELECT id, produit_nom, quantite, date FROM sales WHERE DATE(date) = DATE('now')")
    sales = cursor.fetchall()
    for s in sales:
        print(f"ID: {s['id']} | {s['produit_nom']} x{s['quantite']} @ {s['date']}")
        
    print("\n--- STOCK HISTORY TODAY (BUN ID 1) ---")
    cursor.execute("SELECT * FROM stock_history WHERE product_id = 1 AND DATE(date) = DATE('now')")
    history_bun = cursor.fetchall()
    for h in history_bun:
        print(f"ID: {h['id']} | Date: {h['date']} | Out: {h['qty_out']} | Notes: {h['notes']}")

    print("\n--- STOCK HISTORY TODAY (CHEESE ID 3) ---")
    cursor.execute("SELECT * FROM stock_history WHERE product_id = 3 AND DATE(date) = DATE('now')")
    history_cheese = cursor.fetchall()
    for h in history_cheese:
        print(f"ID: {h['id']} | Date: {h['date']} | Out: {h['qty_out']} | Notes: {h['notes']}")
        
    print("\n--- PRODUCT MASTER STOCK ---")
    cursor.execute("SELECT id, nom, quantite FROM products WHERE id IN (1, 3)")
    products = cursor.fetchall()
    for p in products:
        print(f"ID: {p['id']} | {p['nom']} | Master Qty: {p['quantite']}")
        
    conn.close()

if __name__ == "__main__":
    audit()
