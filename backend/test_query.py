import sqlite3
import os

db_path = "burger_stock.db"
target_date = "2025-12-21"

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print(f"Testing query for date: {target_date}")
cursor.execute("""
    SELECT sh.*, p.nom as product_name
    FROM stock_history sh
    JOIN products p ON sh.product_id = p.id
    WHERE sh.date = ?
    ORDER BY p.nom
""", (target_date,))

rows = cursor.fetchall()
print(f"Found {len(rows)} rows with JOIN")

cursor.execute("SELECT * FROM stock_history WHERE date = ?", (target_date,))
rows_no_join = cursor.fetchall()
print(f"Found {len(rows_no_join)} rows WITHOUT JOIN")

if len(rows_no_join) > 0 and len(rows) == 0:
    print("CRITICAL: JOIN is failing. Checking IDs...")
    cursor.execute("SELECT product_id FROM stock_history WHERE date = ?", (target_date,))
    sh_ids = [r[0] for r in cursor.fetchall()]
    print(f"IDs in stock_history: {sh_ids}")
    
    cursor.execute("SELECT id FROM products")
    p_ids = [r[0] for r in cursor.fetchall()]
    print(f"IDs in products: {p_ids}")

conn.close()
