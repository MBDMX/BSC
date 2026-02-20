"""
Script to initialize yesterday's stock history with current stock values.
This will populate the J-1 table with data.
"""
import database as db
from datetime import datetime, timedelta

def initialize_yesterday_stock():
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Get all products using the database module
    all_products = db.get_all_products()
    
    # Filter for ingredients and PREP items
    products = [p for p in all_products if p.get('type') in ('ING', 'PREP') or p.get('categorie') == 'Ingredient']
    
    print(f"Found {len(products)} products to initialize for {yesterday}")
    
    for product in products:
        product_id = product['id']
        nom = product['nom']
        quantite = product.get('quantite', 0)
        
        # Check if entry already exists
        existing_entries = db.get_all_stock_history_for_date(yesterday)
        has_entry = any(e['product_id'] == product_id for e in existing_entries)
        
        if has_entry:
            print(f"  ⏭️  {nom}: Already has history for {yesterday}")
            continue
        
        # Create entry for yesterday
        db.add_stock_entry(
            product_id=product_id,
            qty_start=quantite,
            qty_in=0,
            qty_out=0,
            notes=f"Initialisation historique pour {nom}",
            entry_date=yesterday
        )
        
        print(f"  ✅ {nom}: Created history entry (qty: {quantite})")
    
    print(f"\n✅ Historique initialisé pour {yesterday}!")

if __name__ == "__main__":
    initialize_yesterday_stock()
