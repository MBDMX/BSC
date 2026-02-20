"""
Diagnostic script to simulate a sale and see what stock changes occur.
This will help identify the bug causing massive stock deductions.
"""
import database as db
import json

def diagnose_sale():
    print("=" * 60)
    print("DIAGNOSTIC: Simulating CHICKEN sale")
    print("=" * 60)
    
    # Get all products before sale
    all_products = db.get_all_products()
    prod_map = {p['id']: p for p in all_products}
    
    # Find CHICKEN
    chicken = next((p for p in all_products if 'CHICKEN' in p['nom']), None)
    if not chicken:
        print("ERROR: CHICKEN product not found!")
        return
    
    print(f"\n1. CHICKEN Product: ID={chicken['id']}, Name={chicken['nom']}")
    
    # Get CHICKEN recipe
    recipe = db.get_product_recipe(chicken['id'])
    print(f"\n2. CHICKEN Recipe ({len(recipe)} ingredients):")
    for ing_id, qty in recipe.items():
        ing_name = prod_map.get(int(ing_id), {}).get('nom', 'UNKNOWN')
        ing_type = prod_map.get(int(ing_id), {}).get('type', 'UNKNOWN')
        print(f"   - ID {ing_id}: {ing_name} ({ing_type}) -> {qty} per unit")
    
    # Record stock BEFORE
    print(f"\n3. Stock BEFORE sale:")
    stock_before = {}
    for ing_id in recipe.keys():
        ing = prod_map.get(int(ing_id))
        if ing:
            stock_before[ing_id] = ing['quantite']
            print(f"   - {ing['nom']}: {ing['quantite']}")
    
    # Simulate what SHOULD happen
    print(f"\n4. Expected deductions for 1 CHICKEN:")
    sale_qty = 1
    for ing_id, qty_per_unit in recipe.items():
        total_deduct = qty_per_unit * sale_qty
        ing_name = prod_map.get(int(ing_id), {}).get('nom', 'UNKNOWN')
        print(f"   - {ing_name}: -{total_deduct}")
    
    # Check if any PREP items have recipes that might cause cascading
    print(f"\n5. Checking for PREP items in recipe (cascading risk):")
    for ing_id in recipe.keys():
        ing = prod_map.get(int(ing_id))
        if ing and ing.get('type') == 'PREP':
            prep_recipe = db.get_product_recipe(int(ing_id))
            if prep_recipe:
                print(f"   ⚠️  {ing['nom']} (PREP) has its own recipe with {len(prep_recipe)} ingredients!")
                for sub_ing_id, sub_qty in prep_recipe.items():
                    sub_name = prod_map.get(int(sub_ing_id), {}).get('nom', 'UNKNOWN')
                    print(f"      - {sub_name}: {sub_qty}")
    
    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    diagnose_sale()
