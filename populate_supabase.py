import sqlite3
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://hteqspsufvevhnrilvbf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXFzcHN1ZnZldmhucmlsdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDE4NTIsImV4cCI6MjA4MjcxNzg1Mn0.ALEiZkHHwCaDRCBGCD28nIsgMkd5kT-pzXf7pscrvtE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def post_to_supabase(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"✅ Table '{table}' updated successfully. Status: {resp.status}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f"⚠️ Error posting to '{table}': {e.code} - {body}")
        return False
    except Exception as e:
        print(f"❌ Connection error to '{table}': {e}")
        return False

def main():
    conn = sqlite3.connect('backend/burger_stock.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Products
    c.execute("SELECT id, nom, quantite, cout_unitaire, seuil, categorie, fournisseur, unite, type, image_url FROM products")
    products = [dict(r) for r in c.fetchall()]
    if products:
        print(f"Pushing {len(products)} products to Supabase...")
        post_to_supabase("products", products)

    # Recipes
    c.execute("SELECT id, product_id, ingredient_id, quantity FROM recipes")
    recipes = [dict(r) for r in c.fetchall()]
    if recipes:
        print(f"Pushing {len(recipes)} recipes to Supabase...")
        post_to_supabase("recipes", recipes)

    # Sales
    c.execute("SELECT id, produit_nom, quantite, prix_unitaire, total, date FROM sales")
    sales = [dict(r) for r in c.fetchall()]
    if sales:
        print(f"Pushing {len(sales)} sales to Supabase...")
        post_to_supabase("sales", sales)

    # Expenses
    c.execute("SELECT id, nom, type, montant, date, recurrence, quantite, unite FROM expenses")
    expenses = [dict(r) for r in c.fetchall()]
    if expenses:
        print(f"Pushing {len(expenses)} expenses to Supabase...")
        post_to_supabase("expenses", expenses)

if __name__ == '__main__':
    main()
