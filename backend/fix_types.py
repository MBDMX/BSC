from database import get_connection

def fix_types():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Fix Bun (ID 1) -> PREP, Ingredient
    # This ensures migrate_types doesn't revert it to PRODUCT
    cursor.execute("UPDATE products SET type = 'PREP', categorie = 'Ingredient' WHERE id = 1")
    print("Fixed Bun (ID 1) -> PREP")

    # 2. Fix Chicken Ingredient (ID 15) -> RAW
    # 'Chicken' raw meat should be RAW. 'CHICKEN' burger (ID 5) stays PRODUCT.
    cursor.execute("UPDATE products SET type = 'RAW' WHERE id = 15")
    print("Fixed Chicken Ingredient (ID 15) -> RAW")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_types()
