import sqlite3
import datetime

def list_all_consumption():
    conn = sqlite3.connect('burger_stock.db')
    cursor = conn.cursor()
    
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    print(f"--- Full Consumption Audit for {today} ---")
    
    query = """
        SELECT p.id, p.nom, SUM(sh.qty_out) 
        FROM products p
        LEFT JOIN stock_history sh ON p.id = sh.product_id AND sh.date >= ?
        GROUP BY p.id
        HAVING SUM(sh.qty_out) > 0
    """
    cursor.execute(query, (today,))
    rows = cursor.fetchall()
    
    if not rows:
        print("No consumption found for today.")
    else:
        print("ID | Product Name | Total Consumed")
        print("-" * 40)
        for row in rows:
            print(f"{row[0]} | {row[1]} | {row[2]}")
            
    conn.close()

if __name__ == "__main__":
    list_all_consumption()
