"""
Check if CHICKEN recipe contains CHICKEN itself (circular reference)
"""
import database as db

def check_circular_references():
    print("=" * 60)
    print("CHECKING FOR CIRCULAR REFERENCES IN RECIPES")
    print("=" * 60)
    
    all_products = db.get_all_products()
    
    issues_found = False
    
    for product in all_products:
        recipe = db.get_product_recipe(product['id'])
        if not recipe:
            continue
        
        # Check if product contains itself in its recipe
        if product['id'] in [int(ing_id) for ing_id in recipe.keys()]:
            issues_found = True
            print(f"\n⚠️  CIRCULAR REFERENCE FOUND!")
            print(f"  Product: {product['nom']} (ID: {product['id']})")
            print(f"  Contains ITSELF in its recipe!")
            print(f"  Quantity: {recipe[product['id']]}")
    
    if not issues_found:
        print("\n✅ No circular references found")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    check_circular_references()
