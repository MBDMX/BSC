import sqlite3
import datetime

def list_history():
    conn = sqlite3.connect('burger_stock.db')
    cursor = conn.cursor()
    
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    print(f"Checking entries for date: {today}")
    
    cursor.execute("""
        SELECT id, product_id, qty_out, notes, date 
        FROM stock_history 
        WHERE date >= date('now', '-1 day')
    """)
    rows = cursor.fetchall()
    
    if not rows:
        print("No matches found for recent entries.")
    else:
        print("ID | PID | QtyOut | Notes | Date")
        print("-" * 50)
        for row in rows:
            print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}")
            
    conn.close()

if __name__ == "__main__":
    list_history()
