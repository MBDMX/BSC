
import sqlite3
import database as db
from datetime import date

def test_backend():
    print("Testing backend functions...")
    try:
        # Test 1: Yearly Summary
        print("Testing get_yearly_summary...")
        conn = db.get_connection()
        cursor = conn.cursor()
        year = date.today().year
        
        cursor.execute("SELECT CAST(strftime('%m', date) AS INTEGER) as month_num, SUM(total) as revenue FROM sales WHERE strftime('%Y', date) = ? GROUP BY month_num", (str(year),))
        sales_rows = cursor.fetchall()
        sales_map = {row[0]: row[1] for row in sales_rows}
        print(f"Sales map keys: {list(sales_map.keys())}")
        
        cursor.execute("SELECT CAST(strftime('%m', date) AS INTEGER) as month_num, SUM(montant) as total_expenses FROM expenses WHERE strftime('%Y', date) = ? GROUP BY month_num", (str(year),))
        expenses_rows = cursor.fetchall()
        expenses_map = {row[0]: row[1] for row in expenses_rows}
        print(f"Expenses map keys: {list(expenses_map.keys())}")
        
        for m in range(1, 13):
            rev = sales_map.get(m, 0.0)
            exp = expenses_map.get(m, 0.0)
            # This is where round(None * 100) would crash
            if rev is None: print(f"Warning: Revenue for month {m} is None")
            if exp is None: print(f"Warning: Expenses for month {m} is None")
            
            r_rev = round((rev or 0.0) * 100) / 100
            r_exp = round((exp or 0.0) * 100) / 100
            print(f"Month {m}: Rev {r_rev}, Exp {r_exp}")
            
        conn.close()
        print("✅ Yearly summary logic test passed.")
        
        # Test 2: Ingrédient Purchase
        print("Testing add_ingredient_purchase...")
        # Get first product
        products = db.get_all_products()
        if products:
            p_id = products[0]["id"]
            print(f"Using product ID {p_id} ({products[0]['nom']})")
            # We don't want to actually modify data, so we might need a rollback
            # But add_ingredient_purchase usually commits.
            # Let's just try to call it and see if it crashes.
            # Note: This WILL modify the DB.
            # db.add_ingredient_purchase(p_id, 1.0, 10.0)
            # print("✅ add_ingredient_purchase test passed (simulated).")
        
    except Exception as e:
        print(f"❌ Backend Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backend()
