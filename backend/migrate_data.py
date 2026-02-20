import sqlite3
from app.db.database import SessionLocal
from app.models.menu_models import Ingredient, Produit, Categorie
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu_schemas import IngredientCreate, ProduitCreate, CategorieCreate

def migrate_data():
    """Migrer les données de burger_stock.db vers burger_menu.db"""

    # Connexion à l'ancienne base
    old_conn = sqlite3.connect('burger_stock.db')
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()

    # Nouvelle session SQLAlchemy
    db = SessionLocal()
    repo = MenuRepository(db)

    try:
        print("Migration des données...")

        # 1. Créer les catégories nécessaires (si elles n'existent pas)
        categories_map = {}

        # Vérifier si les catégories existent déjà
        existing_categories = {cat.nom: cat.id for cat in repo.get_categories()}

        if "Ingrédients" not in existing_categories:
            cat_ingredients = repo.create_categorie(CategorieCreate(
                nom="Ingrédients",
                description="Tous les ingrédients de base"
            ))
            categories_map["Ingredient"] = cat_ingredients.id
            print(f"Catégorie créée: {cat_ingredients.nom}")
        else:
            categories_map["Ingredient"] = existing_categories["Ingrédients"]
            print(f"Catégorie existante utilisée: Ingrédients")

        if "Produits finis" not in existing_categories:
            cat_produits = repo.create_categorie(CategorieCreate(
                nom="Produits finis",
                description="Burgers et plats préparés"
            ))
            categories_map["Main Product"] = cat_produits.id
            print(f"Catégorie créée: {cat_produits.nom}")
        else:
            categories_map["Main Product"] = existing_categories["Produits finis"]
            print(f"Catégorie existante utilisée: Produits finis")

        # 2. Migrer les ingrédients (si pas déjà migrés)
        existing_ingredients = {ing.nom: ing.id for ing in repo.get_ingredients()}
        old_cursor.execute("SELECT * FROM products WHERE categorie = 'Ingredient'")
        ingredients = old_cursor.fetchall()

        print(f"Migration de {len(ingredients)} ingrédients...")
        for ing in ingredients:
            if ing['nom'] not in existing_ingredients:
                try:
                    ingredient_data = IngredientCreate(
                        nom=ing['nom'],
                        unite="kg",  # unité par défaut
                        stock_disponible=float(ing['quantite']),
                        prix_unitaire=float(ing['cout_unitaire'])
                    )
                    new_ing = repo.create_ingredient(ingredient_data)
                    print(f"  ✅ {ing['nom']} migré (ID: {new_ing.id})")
                except Exception as e:
                    print(f"  ❌ Erreur migration ingrédient {ing['nom']}: {e}")
            else:
                print(f"  ⏭️ {ing['nom']} déjà migré (ID: {existing_ingredients[ing['nom']]})")

        # 3. Migrer les produits finis (si pas déjà migrés)
        existing_produits = {prod.nom: prod.id for prod in repo.get_produits()}
        old_cursor.execute("SELECT * FROM products WHERE categorie = 'Main Product'")
        produits = old_cursor.fetchall()

        print(f"Migration de {len(produits)} produits finis...")
        for prod in produits:
            if prod['nom'] not in existing_produits:
                try:
                    produit_data = ProduitCreate(
                        nom=prod['nom'],
                        description=f"Produit: {prod['nom']}",
                        prix=float(prod['cout_unitaire']),
                        categorie_id=categories_map["Main Product"],
                        reference=f"PROD-{prod['id']:03d}",  # Ajouter le champ reference requis
                        disponible="oui"  # String au lieu de bool
                    )
                    new_prod = repo.create_produit(produit_data)
                    print(f"  ✅ {prod['nom']} migré (ID: {new_prod.id})")
                except Exception as e:
                    print(f"  ❌ Erreur migration produit {prod['nom']}: {e}")
            else:
                print(f"  ⏭️ {prod['nom']} déjà migré (ID: {existing_produits[prod['nom']]})")

        db.commit()
        print("Migration terminée avec succès !")

    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        db.rollback()
    finally:
        old_conn.close()
        db.close()

if __name__ == "__main__":
    migrate_data()