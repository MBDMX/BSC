"""
Check what's ACTUALLY in the database for CHICKEN recipe
"""
import database as db
import json

def check_chicken_recipe_in_db():
    print("=" * 60)
    print("CHECKING CHICKEN RECIPE IN DATABASE")
    print("=" * 60)
    
    # Get all products
    all_products = db.get_all_products()
    prod_map = {p['id']: p for p in all_products}
    
    # Find CHICKEN
    chicken = next((p for p in all_products if 'CHICKEN' in p['nom']), None)
    if not chicken:
        print("ERROR: CHICKEN not found!")
        return
    
    print(f"\nCHICKEN Product:")
    print(f"  ID: {chicken['id']}")
    print(f"  Name: {chicken['nom']}")
    print(f"  Type: {chicken['type']}")
    
    # Get recipe
    recipe = db.get_product_recipe(chicken['id'])
    
    print(f"\nCHICKEN Recipe has {len(recipe)} ingredients:")
    print("-" * 60)
    
    for ing_id, qty in recipe.items():
        ing = prod_map.get(int(ing_id))
        if ing:
            print(f"  [{ing['type']}] {ing['nom']} (ID: {ing_id})")
            print(f"      Quantity per CHICKEN: {qty}")
            print(f"      Current stock: {ing['quantite']}")
            
            # If it's a PREP item, show its sub-recipe
            if ing['type'] == 'PREP':
                sub_recipe = db.get_product_recipe(int(ing_id))
                if sub_recipe:
                    print(f"      ⚠️  This PREP has {len(sub_recipe)} sub-ingredients:")
                    for sub_id, sub_qty in sub_recipe.items():
                        sub_ing = prod_map.get(int(sub_id))
                        if sub_ing:
                            print(f"          - {sub_ing['nom']}: {sub_qty}")
        else:
            print(f"  UNKNOWN INGREDIENT ID: {ing_id} (qty: {qty})")
        print()
    
    print("=" * 60)

if __name__ == "__main__":
    check_chicken_recipe_in_db()
