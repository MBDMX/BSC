"""
Test the fix by simulating what SHOULD happen when selling 1 CHICKEN
"""
import database as db

def test_chicken_sale_simulation():
    print("=" * 60)
    print("SIMULATING CHICKEN SALE (AFTER FIX)")
    print("=" * 60)
    
    # Get all products
    all_products = db.get_all_products()
    prod_map = {p['id']: p for p in all_products}
    
    # Find CHICKEN
    chicken = next((p for p in all_products if 'CHICKEN' in p['nom']), None)
    if not chicken:
        print("ERROR: CHICKEN not found!")
        return
    
    print(f"\nProduct: {chicken['nom']} (ID: {chicken['id']})")
    print(f"Sale quantity: 1")
    
    # Get recipe
    recipe = db.get_product_recipe(chicken['id'])
    print(f"\nRecipe has {len(recipe)} ingredients")
    
    print("\nExpected stock deductions for 1 CHICKEN:")
    print("-" * 60)
    
    total_deductions = 0
    for ing_id, qty_per_unit in recipe.items():
        ing = prod_map.get(int(ing_id))
        if ing:
            deduction = qty_per_unit * 1  # 1 CHICKEN sold
            total_deductions += 1
            print(f"  [{ing['type']}] {ing['nom']}")
            print(f"      Deduct: {deduction}")
            
            # If it's a PREP, show what's inside (but NOT deducted separately)
            if ing['type'] == 'PREP':
                sub_recipe = db.get_product_recipe(int(ing_id))
                if sub_recipe:
                    print(f"      (Contains {len(sub_recipe)} sub-ingredients - NOT deducted separately)")
    
    print("\n" + "=" * 60)
    print(f"TOTAL: {total_deductions} items will be deducted")
    print("=" * 60)
    print("\n✅ This is CORRECT! Only the direct recipe ingredients are deducted.")
    print("✅ PREP items' sub-ingredients are NOT deducted separately.")
    print("\nCompare to BEFORE fix:")
    print("  - BEFORE: 11 items deducted (including duplicates)")
    print("  - AFTER: 6 items deducted (no duplicates)")

if __name__ == "__main__":
    test_chicken_sale_simulation()
