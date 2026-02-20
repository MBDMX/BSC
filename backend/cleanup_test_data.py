import sqlite3
import datetime

def cleanup():
    conn = sqlite3.connect('burger_stock.db')
    cursor = conn.cursor()
    
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 1. Identify test sales (DOUBLE burgers today)
    # The user only sold Quadruple and Chicken
    cursor.execute("""
        SELECT id, product_id, qty_out, notes 
        FROM stock_history 
        WHERE date = ? AND notes LIKE '%DOUBLE%'
    """, (today,))
    entries = cursor.fetchall()
    
    if not entries:
        print("No test entries found to clean up.")
        return

    print(f"Found {len(entries)} test entries. Cleaning up...")
    
    for entry_id, product_id, qty_out, notes in entries:
        # 2. Revert the quantity in products table
        cursor.execute("UPDATE products SET quantite = quantite + ? WHERE id = ?", (qty_out, product_id))
        
        # 3. Delete the history entry
        cursor.execute("DELETE FROM stock_history WHERE id = ?", (entry_id,))
        print(f"  Deleted entry {entry_id} (Deducted {qty_out} from product {product_id})")
    
    conn.commit()
    conn.close()
    print("Cleanup complete. Database restored to user-only sales.")

if __name__ == "__main__":
    cleanup()
