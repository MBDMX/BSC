import database as db

def check_all_recipes():
    products = db.get_all_products()
    print(f"Total Products: {len(products)}")
    
    prod_map = {p['id']: p for p in products}
    
    for p in products:
        recipe = db.get_product_recipe(p['id'])
        if recipe:
            print(f"\nRECIPE FOR: {p['nom']} (ID: {p['id']}, Type: {p.get('type')})")
            for ing_id, qty in recipe.items():
                ing_name = prod_map.get(ing_id, {}).get('nom', 'UNKNOWN')
                ing_type = prod_map.get(ing_id, {}).get('type', 'UNKNOWN')
                print(f"  - {ing_name} (ID: {ing_id}, Type: {ing_type}): {qty}")
        else:
            # print(f"No recipe for: {p['nom']} (ID: {p['id']})")
            pass

if __name__ == "__main__":
    check_all_recipes()
