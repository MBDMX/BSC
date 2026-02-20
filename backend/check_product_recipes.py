"""
Check if any PRODUCT types are in other PRODUCT recipes
This would explain why selling CHICKEN deducts other products
"""
import database as db

def check_product_in_recipes():
    print("=" * 60)
    print("CHECKING FOR PRODUCTS IN PRODUCT RECIPES")
    print("=" * 60)
    
    all_products = db.get_all_products()
    
    # Separate by type
    products_finished = [p for p in all_products if p['type'] == 'PRODUCT']
    
    print(f"\nFound {len(products_finished)} finished PRODUCT items:")
    for p in products_finished:
        print(f"  - {p['nom']} (ID: {p['id']})")
    
    print("\n" + "=" * 60)
    print("Checking if any PRODUCT recipes contain other PRODUCTS...")
    print("=" * 60)
    
    issues_found = False
    
    for product in products_finished:
        recipe = db.get_product_recipe(product['id'])
        if not recipe:
            continue
            
        # Check if recipe contains any PRODUCT types
        for ing_id in recipe.keys():
            ing = next((p for p in all_products if p['id'] == int(ing_id)), None)
            if ing and ing['type'] == 'PRODUCT':
                issues_found = True
                print(f"\n⚠️  PROBLEM FOUND!")
                print(f"  Product: {product['nom']} (ID: {product['id']})")
                print(f"  Contains: {ing['nom']} (ID: {ing['id']}) - TYPE: {ing['type']}")
                print(f"  Quantity: {recipe[ing_id]}")
    
    if not issues_found:
        print("\n✅ No PRODUCT types found in PRODUCT recipes")
    else:
        print("\n" + "=" * 60)
        print("⚠️  PRODUCTS should NOT contain other PRODUCTS!")
        print("=" * 60)

if __name__ == "__main__":
    check_product_in_recipes()
