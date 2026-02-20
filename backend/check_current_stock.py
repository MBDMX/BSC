"""
Check current stock levels after the CHICKEN sale
"""
import database as db

def check_current_stock():
    print("=" * 60)
    print("CURRENT STOCK LEVELS AFTER CHICKEN SALE")
    print("=" * 60)
    
    all_products = db.get_all_products()
    
    # Get CHICKEN recipe ingredients
    chicken = next((p for p in all_products if 'CHICKEN' in p['nom']), None)
    if not chicken:
        print("ERROR: CHICKEN not found!")
        return
    
    recipe = db.get_product_recipe(chicken['id'])
    recipe_ids = [int(ing_id) for ing_id in recipe.keys()]
    
    print(f"\nCHICKEN Recipe Ingredients (Expected Deductions):")
    print("-" * 60)
    
    for ing_id in recipe_ids:
        ing = next((p for p in all_products if p['id'] == ing_id), None)
        if ing:
            expected_deduction = recipe[ing_id]
            current_stock = ing['quantite']
            print(f"\n[{ing['type']}] {ing['nom']} (ID: {ing_id})")
            print(f"  Expected deduction: -{expected_deduction}")
            print(f"  Current stock: {current_stock}")
            print(f"  Unit: {ing.get('unite', 'N/A')}")
    
    print("\n" + "=" * 60)
    print("ALL PRODUCTS WITH NON-ZERO STOCK:")
    print("=" * 60)
    
    for p in sorted(all_products, key=lambda x: x['id']):
        if p['quantite'] != 0:
            print(f"\n[{p['type']}] {p['nom']} (ID: {p['id']})")
            print(f"  Stock: {p['quantite']}")
            print(f"  Unit: {p.get('unite', 'N/A')}")

if __name__ == "__main__":
    check_current_stock()
