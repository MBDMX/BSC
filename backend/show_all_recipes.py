"""
Comprehensive check: Show ALL products and their recipes
to understand the complete picture
"""
import database as db

def show_all_recipes():
    print("=" * 80)
    print("COMPLETE RECIPE ANALYSIS")
    print("=" * 80)
    
    all_products = db.get_all_products()
    prod_map = {p['id']: p for p in all_products}
    
    # Group by type
    by_type = {}
    for p in all_products:
        ptype = p['type']
        if ptype not in by_type:
            by_type[ptype] = []
        by_type[ptype].append(p)
    
    # Show each type
    for ptype in ['PRODUCT', 'PREP', 'ING']:
        if ptype not in by_type:
            continue
            
        print(f"\n{'='*80}")
        print(f"{ptype} Items ({len(by_type[ptype])} total)")
        print('='*80)
        
        for product in sorted(by_type[ptype], key=lambda x: x['id']):
            recipe = db.get_product_recipe(product['id'])
            
            print(f"\n[{product['id']}] {product['nom']} (Stock: {product['quantite']})")
            
            if recipe:
                print(f"  Recipe ({len(recipe)} ingredients):")
                for ing_id, qty in recipe.items():
                    ing = prod_map.get(int(ing_id))
                    if ing:
                        print(f"    - [{ing['type']}] {ing['nom']} (ID:{ing_id}): {qty}")
                    else:
                        print(f"    - UNKNOWN ID:{ing_id}: {qty}")
            else:
                print("  No recipe")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    show_all_recipes()
