import sqlite3

def check_history():
    conn = sqlite3.connect('burger_stock.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- FULL HISTORY FOR BUN (ID 1) ---")
    cursor.execute("SELECT * FROM stock_history WHERE product_id = 1 ORDER BY date DESC")
    rows = cursor.fetchall()
    total_out = 0
    for r in rows:
        print(f"ID: {r['id']} | Date: {r['date']} | Out: {r['qty_out']} | End: {r['qty_end']} | Notes: {r['notes']}")
        total_out += r['qty_out']
    
    print(f"\nTotal Detected Qty Out in History: {total_out}")
    
    cursor.execute("SELECT quantite FROM products WHERE id = 1")
    master_qty = cursor.fetchone()[0]
    print(f"Master Quantity in Products Table: {master_qty}")
    
    conn.close()

if __name__ == "__main__":
    check_history()
