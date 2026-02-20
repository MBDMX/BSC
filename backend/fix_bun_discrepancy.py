import sqlite3
import datetime

def diagnostic_and_fix():
    conn = sqlite3.connect('burger_stock.db')
    cursor = conn.cursor()
    
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    print(f"--- Diagnostic for {today} ---")
    
    # 1. Total consumption according to get_consumption_data logic
    cursor.execute("""
        SELECT SUM(qty_out) 
        FROM stock_history 
        WHERE product_id = 1 AND date >= ? 
    """, (today,))
    total = cursor.fetchone()[0] or 0
    print(f"Total Bun consumption found: {total}")
    
    # 2. List all entries for Bun today
    cursor.execute("""
        SELECT id, qty_out, notes, date 
        FROM stock_history 
        WHERE product_id = 1 AND date >= ?
    """, (today,))
    rows = cursor.fetchall()
    
    for row in rows:
        print(f"Entry {row[0]}: {row[1]} units | Notes: {row[2]} | Date: {row[3]}")
    
    # 3. Fix: We want only 2.0 Buns total today (1 Quadruple + 1 Chicken)
    # If total > 2.0, we need to remove the difference
    if total > 2.0:
        over_count = total - 2.0
        print(f"Detected overcount of {over_count} Buns. Fixing...")
        
        # We'll look for entries containing "DOUBLE" as those are my tests
        cursor.execute("""
            SELECT id, qty_out 
            FROM stock_history 
            WHERE product_id = 1 AND date >= ? AND notes LIKE '%DOUBLE%'
        """, (today,))
        test_rows = cursor.fetchall()
        
        for tid, tqty in test_rows:
            # Revert product balance
            cursor.execute("UPDATE products SET quantite = quantite + ? WHERE id = 1", (tqty,))
            # Delete history
            cursor.execute("DELETE FROM stock_history WHERE id = ?", (tid,))
            print(f"  Fixed! Deleted entry {tid} ({tqty} units) and restored product quantity.")
            
        conn.commit()
    else:
        print("Total consumption is 2.0 or less. No fix needed based on your request.")

    conn.close()

if __name__ == "__main__":
    diagnostic_and_fix()
