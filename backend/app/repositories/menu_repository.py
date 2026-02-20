from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from app.models.menu_models import Categorie, Produit, Ingredient, Recette, RecetteIngredient
from app.schemas.menu_schemas import CategorieCreate, ProduitCreate, IngredientCreate, RecetteCreate

class MenuRepository:
    def __init__(self, db: Session):
        self.db = db

    # === CATÉGORIES ===
    def create_categorie(self, categorie: CategorieCreate) -> Categorie:
        db_categorie = Categorie(**categorie.dict())
        self.db.add(db_categorie)
        self.db.commit()
        self.db.refresh(db_categorie)
        return db_categorie

    def get_categories(self) -> List[Categorie]:
        return self.db.query(Categorie).all()

    def get_categorie_by_id(self, categorie_id: int) -> Optional[Categorie]:
        return self.db.query(Categorie).filter(Categorie.id == categorie_id).first()

    def update_categorie(self, categorie_id: int, categorie_data: dict) -> Optional[Categorie]:
        db_categorie = self.get_categorie_by_id(categorie_id)
        if db_categorie:
            for key, value in categorie_data.items():
                setattr(db_categorie, key, value)
            self.db.commit()
            self.db.refresh(db_categorie)
        return db_categorie

    def delete_categorie(self, categorie_id: int) -> bool:
        db_categorie = self.get_categorie_by_id(categorie_id)
        if db_categorie:
            self.db.delete(db_categorie)
            self.db.commit()
            return True
        return False

    # === INGRÉDIENTS ===
    def create_ingredient(self, ingredient: IngredientCreate) -> Ingredient:
        db_ingredient = Ingredient(**ingredient.dict())
        self.db.add(db_ingredient)
        self.db.commit()
        self.db.refresh(db_ingredient)
        return db_ingredient

    def get_ingredients(self) -> List[Ingredient]:
        return self.db.query(Ingredient).all()

    def get_ingredient_by_id(self, ingredient_id: int) -> Optional[Ingredient]:
        return self.db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()

    def update_ingredient(self, ingredient_id: int, ingredient_data: dict) -> Optional[Ingredient]:
        db_ingredient = self.get_ingredient_by_id(ingredient_id)
        if db_ingredient:
            for key, value in ingredient_data.items():
                setattr(db_ingredient, key, value)
            self.db.commit()
            self.db.refresh(db_ingredient)
        return db_ingredient

    def delete_ingredient(self, ingredient_id: int) -> bool:
        db_ingredient = self.get_ingredient_by_id(ingredient_id)
        if db_ingredient:
            self.db.delete(db_ingredient)
            self.db.commit()
            return True
        return False

    # === PRODUITS ===
    def create_produit(self, produit: ProduitCreate) -> Produit:
        # Créer le produit
        produit_data = produit.dict(exclude={'recette'})
        db_produit = Produit(**produit_data)
        self.db.add(db_produit)
        self.db.commit()
        self.db.refresh(db_produit)

        # Créer la recette si fournie
        if produit.recette:
            recette_data = produit.recette.dict(exclude={'ingredients'})
            db_recette = Recette(**recette_data, produit_id=db_produit.id)
            self.db.add(db_recette)
            self.db.commit()
            self.db.refresh(db_recette)

            # Ajouter les ingrédients de la recette
            for ingredient_data in produit.recette.ingredients:
                db_recette_ingredient = RecetteIngredient(
                    recette_id=db_recette.id,
                    ingredient_id=ingredient_data.ingredient_id,
                    quantite=ingredient_data.quantite
                )
                self.db.add(db_recette_ingredient)
            
            self.db.commit()

        return db_produit

    def get_produits(self) -> List[Produit]:
        return self.db.query(Produit).all()

    def get_produit_by_id(self, produit_id: int) -> Optional[Produit]:
        return self.db.query(Produit).filter(Produit.id == produit_id).first()

    def get_produit_by_reference(self, reference: str) -> Optional[Produit]:
        return self.db.query(Produit).filter(Produit.reference == reference).first()

    def get_produits_by_categorie(self, categorie_id: int) -> List[Produit]:
        return self.db.query(Produit).filter(Produit.categorie_id == categorie_id).all()

    def update_produit(self, produit_id: int, produit_data: dict) -> Optional[Produit]:
        db_produit = self.get_produit_by_id(produit_id)
        if db_produit:
            for key, value in produit_data.items():
                if key != 'recette':  # Ne pas mettre à jour la recette ici
                    setattr(db_produit, key, value)
            self.db.commit()
            self.db.refresh(db_produit)
        return db_produit

    def delete_produit(self, produit_id: int) -> bool:
        db_produit = self.get_produit_by_id(produit_id)
        if db_produit:
            self.db.delete(db_produit)
            self.db.commit()
            return True
        return False

    # === RECETTES ===
    def create_recette(self, produit_id: int, recette: RecetteCreate) -> Recette:
        # Créer la recette
        recette_data = recette.dict(exclude={'ingredients'})
        db_recette = Recette(**recette_data, produit_id=produit_id)
        self.db.add(db_recette)
        self.db.commit()
        self.db.refresh(db_recette)

        # Ajouter les ingrédients
        for ingredient_data in recette.ingredients:
            db_recette_ingredient = RecetteIngredient(
                recette_id=db_recette.id,
                ingredient_id=ingredient_data.ingredient_id,
                quantite=ingredient_data.quantite
            )
            self.db.add(db_recette_ingredient)
        
        self.db.commit()
        return db_recette

    def get_recette_by_produit_id(self, produit_id: int) -> Optional[Recette]:
        return self.db.query(Recette).filter(Recette.produit_id == produit_id).first()

    def update_recette(self, recette_id: int, recette_data: dict) -> Optional[Recette]:
        db_recette = self.db.query(Recette).filter(Recette.id == recette_id).first()
        if db_recette:
            for key, value in recette_data.items():
                if key != 'ingredients':  # Ne pas mettre à jour les ingrédients ici
                    setattr(db_recette, key, value)
            self.db.commit()
            self.db.refresh(db_recette)
        return db_recette

    # === MÉTHODES UTILITAIRES ===
    def get_menu_complet(self):
        """Récupère le menu complet avec toutes les relations"""
        categories = self.get_categories()
        produits = self.db.query(Produit).all()
        ingredients = self.get_ingredients()
        
        return {
            "categories": categories,
            "produits": produits,
            "ingredients": ingredients
        }

    def calculer_cout_recette(self, recette_id: int) -> float:
        """Calcule le coût total d'une recette basé sur les ingrédients"""
        recette_ingredients = self.db.query(RecetteIngredient).filter(
            RecetteIngredient.recette_id == recette_id
        ).all()
        
        cout_total = 0.0
        for ri in recette_ingredients:
            ingredient = self.get_ingredient_by_id(ri.ingredient_id)
            if ingredient:
                cout_total += ingredient.prix_unitaire * ri.quantite
        
        return cout_total

    def verifier_stock_ingredients(self, recette_id: int) -> dict:
        """Vérifie si tous les ingrédients d'une recette sont disponibles en stock"""
        recette_ingredients = self.db.query(RecetteIngredient).filter(
            RecetteIngredient.recette_id == recette_id
        ).all()
        
        resultat = {
            "disponible": True,
            "ingredients_manquants": []
        }
        
        for ri in recette_ingredients:
            ingredient = self.get_ingredient_by_id(ri.ingredient_id)
            if ingredient and ingredient.stock_disponible < ri.quantite:
                resultat["disponible"] = False
                resultat["ingredients_manquants"].append({
                    "ingredient": ingredient.nom,
                    "requis": ri.quantite,
                    "disponible": ingredient.stock_disponible
                })
        
        return resultat 