from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal
from app.models.menu_models import Base
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu_schemas import CategorieCreate, IngredientCreate, ProduitCreate, RecetteCreate, RecetteIngredientCreate

def init_db():
    """Initialise la base de données avec des données d'exemple"""
    # Créer les tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    repo = MenuRepository(db)
    
    try:
        # Vérifier si des données existent déjà
        if repo.get_categories():
            print("Base de données déjà initialisée")
            return
        
        print("Initialisation de la base de données...")
        
        # === CRÉER LES CATÉGORIES ===
        categories_data = [
            {"nom": "Burgers", "description": "Burgers classiques et spéciaux"},
            {"nom": "Boissons", "description": "Boissons fraîches et chaudes"},
            {"nom": "Desserts", "description": "Desserts et pâtisseries"},
            {"nom": "Accompagnements", "description": "Frites, salades et autres accompagnements"}
        ]
        
        categories = []
        for cat_data in categories_data:
            categorie = repo.create_categorie(CategorieCreate(**cat_data))
            categories.append(categorie)
            print(f"Catégorie créée: {categorie.nom}")
        
        # === CRÉER LES INGRÉDIENTS ===
        ingredients_data = [
            {"nom": "Pain à burger", "unite": "unité", "stock_disponible": 100, "prix_unitaire": 0.5},
            {"nom": "Steak de bœuf", "unite": "kg", "stock_disponible": 50, "prix_unitaire": 15.0},
            {"nom": "Fromage cheddar", "unite": "kg", "stock_disponible": 20, "prix_unitaire": 8.0},
            {"nom": "Laitue", "unite": "kg", "stock_disponible": 10, "prix_unitaire": 2.0},
            {"nom": "Tomate", "unite": "kg", "stock_disponible": 15, "prix_unitaire": 3.0},
            {"nom": "Oignon", "unite": "kg", "stock_disponible": 8, "prix_unitaire": 1.5},
            {"nom": "Bacon", "unite": "kg", "stock_disponible": 12, "prix_unitaire": 12.0},
            {"nom": "Sauce mayonnaise", "unite": "L", "stock_disponible": 20, "prix_unitaire": 5.0},
            {"nom": "Sauce ketchup", "unite": "L", "stock_disponible": 15, "prix_unitaire": 4.0},
            {"nom": "Pommes de terre", "unite": "kg", "stock_disponible": 30, "prix_unitaire": 2.5},
            {"nom": "Huile de friture", "unite": "L", "stock_disponible": 50, "prix_unitaire": 3.0},
            {"nom": "Coca-Cola", "unite": "L", "stock_disponible": 100, "prix_unitaire": 2.0},
            {"nom": "Glace vanille", "unite": "L", "stock_disponible": 25, "prix_unitaire": 6.0},
            {"nom": "Chocolat", "unite": "kg", "stock_disponible": 8, "prix_unitaire": 10.0},
            {"nom": "Farine", "unite": "kg", "stock_disponible": 20, "prix_unitaire": 1.0},
            {"nom": "Œufs", "unite": "unité", "stock_disponible": 200, "prix_unitaire": 0.3},
            {"nom": "Lait", "unite": "L", "stock_disponible": 40, "prix_unitaire": 1.5},
            {"nom": "Sucre", "unite": "kg", "stock_disponible": 15, "prix_unitaire": 1.2}
        ]
        
        ingredients = []
        for ing_data in ingredients_data:
            ingredient = repo.create_ingredient(IngredientCreate(**ing_data))
            ingredients.append(ingredient)
            print(f"Ingrédient créé: {ingredient.nom}")
        
        # === CRÉER LES PRODUITS AVEC RECETTES ===
        
        # 1. Burger Classique
        burger_classique = ProduitCreate(
            nom="Burger Classique",
            reference="BURG-001",
            description="Burger traditionnel avec steak, fromage, salade et tomate",
            prix=8.50,
            categorie_id=categories[0].id,  # Burgers
            recette=RecetteCreate(
                instructions="1. Faire cuire le steak 3-4 min chaque côté\n2. Faire griller le pain\n3. Assembler avec fromage, salade, tomate et oignon",
                temps_preparation=8,
                difficulte="facile",
                ingredients=[
                    RecetteIngredientCreate(ingredient_id=ingredients[0].id, quantite=1),  # Pain
                    RecetteIngredientCreate(ingredient_id=ingredients[1].id, quantite=0.15),  # Steak
                    RecetteIngredientCreate(ingredient_id=ingredients[2].id, quantite=0.03),  # Fromage
                    RecetteIngredientCreate(ingredient_id=ingredients[3].id, quantite=0.02),  # Laitue
                    RecetteIngredientCreate(ingredient_id=ingredients[4].id, quantite=0.03),  # Tomate
                    RecetteIngredientCreate(ingredient_id=ingredients[5].id, quantite=0.01),  # Oignon
                    RecetteIngredientCreate(ingredient_id=ingredients[7].id, quantite=0.02),  # Mayo
                ]
            )
        )
        repo.create_produit(burger_classique)
        print("Produit créé: Burger Classique")
        
        # 2. Burger Bacon
        burger_bacon = ProduitCreate(
            nom="Burger Bacon",
            reference="BURG-002",
            description="Burger avec bacon croustillant et fromage fondu",
            prix=10.50,
            categorie_id=categories[0].id,
            recette=RecetteCreate(
                instructions="1. Faire cuire le bacon jusqu'à croustillant\n2. Faire cuire le steak\n3. Assembler avec bacon et fromage fondu",
                temps_preparation=10,
                difficulte="facile",
                ingredients=[
                    RecetteIngredientCreate(ingredient_id=ingredients[0].id, quantite=1),
                    RecetteIngredientCreate(ingredient_id=ingredients[1].id, quantite=0.15),
                    RecetteIngredientCreate(ingredient_id=ingredients[2].id, quantite=0.04),
                    RecetteIngredientCreate(ingredient_id=ingredients[6].id, quantite=0.05),
                    RecetteIngredientCreate(ingredient_id=ingredients[3].id, quantite=0.02),
                    RecetteIngredientCreate(ingredient_id=ingredients[7].id, quantite=0.02),
                ]
            )
        )
        repo.create_produit(burger_bacon)
        print("Produit créé: Burger Bacon")
        
        # 3. Frites
        frites = ProduitCreate(
            nom="Frites Maison",
            reference="ACCOMP-001",
            description="Frites fraîches et croustillantes",
            prix=4.50,
            categorie_id=categories[3].id,  # Accompagnements
            recette=RecetteCreate(
                instructions="1. Éplucher et couper les pommes de terre\n2. Faire tremper dans l'eau froide\n3. Faire frire à 180°C jusqu'à doré",
                temps_preparation=15,
                difficulte="moyen",
                ingredients=[
                    RecetteIngredientCreate(ingredient_id=ingredients[9].id, quantite=0.2),  # Pommes de terre
                    RecetteIngredientCreate(ingredient_id=ingredients[10].id, quantite=0.1),  # Huile
                ]
            )
        )
        repo.create_produit(frites)
        print("Produit créé: Frites Maison")
        
        # 4. Coca-Cola
        coca_cola = ProduitCreate(
            nom="Coca-Cola",
            reference="BOIS-001",
            description="Coca-Cola fraîche 33cl",
            prix=2.50,
            categorie_id=categories[1].id,  # Boissons
            recette=RecetteCreate(
                instructions="Servir frais avec glaçons",
                temps_preparation=1,
                difficulte="facile",
                ingredients=[
                    RecetteIngredientCreate(ingredient_id=ingredients[11].id, quantite=0.33),  # Coca-Cola
                ]
            )
        )
        repo.create_produit(coca_cola)
        print("Produit créé: Coca-Cola")
        
        # 5. Milkshake Chocolat
        milkshake = ProduitCreate(
            nom="Milkshake Chocolat",
            reference="DESS-001",
            description="Milkshake crémeux au chocolat",
            prix=5.50,
            categorie_id=categories[2].id,  # Desserts
            recette=RecetteCreate(
                instructions="1. Mélanger glace vanille, lait et chocolat\n2. Mixer jusqu'à consistance crémeuse",
                temps_preparation=5,
                difficulte="facile",
                ingredients=[
                    RecetteIngredientCreate(ingredient_id=ingredients[12].id, quantite=0.2),  # Glace
                    RecetteIngredientCreate(ingredient_id=ingredients[13].id, quantite=0.05),  # Chocolat
                    RecetteIngredientCreate(ingredient_id=ingredients[16].id, quantite=0.15),  # Lait
                ]
            )
        )
        repo.create_produit(milkshake)
        print("Produit créé: Milkshake Chocolat")
        
        print("✅ Base de données initialisée avec succès!")
        print(f"📊 Statistiques:")
        print(f"   - {len(categories)} catégories créées")
        print(f"   - {len(ingredients)} ingrédients créés")
        print(f"   - 5 produits avec recettes créés")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 