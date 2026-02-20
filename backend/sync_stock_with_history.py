import sqlite3

def sync_stock():
    conn = sqlite3.connect('burger_stock.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- SYNCING STOCK WITH HISTORY ---")
    
    # Get all products
    cursor.execute("SELECT id, nom, quantite FROM products")
    products = cursor.fetchall()
    
    for p in products:
        p_id = p['id']
        p_name = p['nom']
        current_master = p['quantite']
        
        # Calculate expected stock from history
        # (Assuming starting stock was 0 for all for now, or we can use the FIRST entry's qty_start)
        cursor.execute("SELECT qty_start FROM stock_history WHERE product_id = ? ORDER BY date ASC LIMIT 1", (p_id,))
        first_entry = cursor.fetchone()
        
        initial_stock = first_entry[0] if first_entry else 0
        
        cursor.execute("SELECT SUM(qty_in), SUM(qty_out) FROM stock_history WHERE product_id = ?", (p_id,))
        sums = cursor.fetchone()
        total_in = sums[0] if sums[0] else 0
        total_out = sums[1] if sums[1] else 0
        
        expected_stock = initial_stock + total_in - total_out
        
        if abs(current_master - expected_stock) > 0.001:
            print(f"Mismatch for {p_name} (ID {p_id}): Master={current_master}, Expected={expected_stock}")
            cursor.execute("UPDATE products SET quantite = ? WHERE id = ?", (expected_stock, p_id))
            print(f"  -> Fixed to {expected_stock}")
        else:
            print(f"Check passed for {p_name} (ID {p_id}): {current_master}")

    conn.commit()
    conn.close()
    print("\nSync complete.")

if __name__ == "__main__":
    sync_stock()
