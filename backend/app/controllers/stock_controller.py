from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.menu_models import Ingredient
from app.schemas.stock_schemas import (
    IngredientCreate, 
    IngredientUpdate, 
    IngredientResponse,
    StockMovement,
    StockAlert
)
from datetime import datetime
import logging

router = APIRouter(prefix="/stock", tags=["stock"])

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/ingredients", response_model=List[IngredientResponse])
async def get_ingredients(db: Session = Depends(get_db)):
    """Récupérer tous les ingrédients avec leurs stocks"""
    try:
        ingredients = db.query(Ingredient).all()
        logger.info(f"Récupération de {len(ingredients)} ingrédients")
        return ingredients
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des ingrédients: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Récupérer un ingrédient spécifique"""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    return ingredient

@router.post("/ingredients", response_model=IngredientResponse)
async def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    """Créer un nouvel ingrédient"""
    try:
        db_ingredient = Ingredient(
            nom=ingredient.nom,
            unite=ingredient.unite,
            stock_disponible=ingredient.stock_disponible,
            prix_unitaire=ingredient.prix_unitaire
        )
        db.add(db_ingredient)
        db.commit()
        db.refresh(db_ingredient)
        logger.info(f"Nouvel ingrédient créé: {ingredient.nom}")
        return db_ingredient
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la création de l'ingrédient: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création")

@router.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: int, 
    ingredient_update: IngredientUpdate, 
    db: Session = Depends(get_db)
):
    """Mettre à jour un ingrédient"""
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    
    try:
        for field, value in ingredient_update.dict(exclude_unset=True).items():
            setattr(db_ingredient, field, value)
        
        db.commit()
        db.refresh(db_ingredient)
        logger.info(f"Ingrédient mis à jour: {db_ingredient.nom}")
        return db_ingredient
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")

@router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Supprimer un ingrédient"""
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    
    try:
        db.delete(db_ingredient)
        db.commit()
        logger.info(f"Ingrédient supprimé: {db_ingredient.nom}")
        return {"message": "Ingrédient supprimé avec succès"}
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")

@router.post("/ingredients/{ingredient_id}/movement")
async def add_stock_movement(
    ingredient_id: int, 
    movement: StockMovement, 
    db: Session = Depends(get_db)
):
    """Ajouter un mouvement de stock (entrée/sortie)"""
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    
    try:
        # Calculer le nouveau stock
        if movement.type == "entree":
            db_ingredient.stock_disponible += movement.quantite
        elif movement.type == "sortie":
            if db_ingredient.stock_disponible < movement.quantite:
                raise HTTPException(status_code=400, detail="Stock insuffisant")
            db_ingredient.stock_disponible -= movement.quantite
        else:
            raise HTTPException(status_code=400, detail="Type de mouvement invalide")
        
        db.commit()
        db.refresh(db_ingredient)
        logger.info(f"Mouvement de stock: {movement.type} {movement.quantite} {db_ingredient.unite} de {db_ingredient.nom}")
        return {
            "message": f"Mouvement de stock enregistré",
            "nouveau_stock": db_ingredient.stock_disponible,
            "ingredient": db_ingredient
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors du mouvement de stock: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du mouvement de stock")

@router.get("/alerts", response_model=List[StockAlert])
async def get_stock_alerts(db: Session = Depends(get_db)):
    """Récupérer les alertes de stock (stock faible)"""
    try:
        # Définir un seuil de 10% du stock initial ou 5 unités minimum
        ingredients = db.query(Ingredient).all()
        alerts = []
        
        for ingredient in ingredients:
            # Seuil basé sur le prix unitaire et la nature du produit
            if ingredient.prix_unitaire > 10:  # Produits chers
                seuil = max(2, ingredient.stock_disponible * 0.1)
            elif ingredient.prix_unitaire > 5:  # Produits moyens
                seuil = max(5, ingredient.stock_disponible * 0.15)
            else:  # Produits bon marché
                seuil = max(10, ingredient.stock_disponible * 0.2)
            
            if ingredient.stock_disponible <= seuil:
                alerts.append(StockAlert(
                    ingredient_id=ingredient.id,
                    ingredient_nom=ingredient.nom,
                    stock_actuel=ingredient.stock_disponible,
                    seuil_alerte=seuil,
                    unite=ingredient.unite,
                    niveau_urgence="critique" if ingredient.stock_disponible <= seuil * 0.5 else "attention"
                ))
        
        logger.info(f"Génération de {len(alerts)} alertes de stock")
        return alerts
    except Exception as e:
        logger.error(f"Erreur lors de la génération des alertes: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération des alertes")

@router.get("/statistics")
async def get_stock_statistics(db: Session = Depends(get_db)):
    """Récupérer les statistiques de stock"""
    try:
        ingredients = db.query(Ingredient).all()
        
        total_ingredients = len(ingredients)
        total_stock_value = sum(ing.stock_disponible * ing.prix_unitaire for ing in ingredients)
        low_stock_count = len([ing for ing in ingredients if ing.stock_disponible < 5])
        
        # Calculer la valeur moyenne par ingrédient
        avg_value_per_ingredient = total_stock_value / max(total_ingredients, 1)
        
        # Trouver les ingrédients les plus chers
        most_expensive = sorted(ingredients, key=lambda x: x.prix_unitaire, reverse=True)[:5]
        
        # Trouver les ingrédients avec le plus de stock
        highest_stock = sorted(ingredients, key=lambda x: x.stock_disponible, reverse=True)[:5]
        
        return {
            "total_ingredients": total_ingredients,
            "total_stock_value": round(total_stock_value, 2),
            "avg_value_per_ingredient": round(avg_value_per_ingredient, 2),
            "low_stock_count": low_stock_count,
            "most_expensive": [
                {
                    "id": ing.id,
                    "nom": ing.nom,
                    "prix_unitaire": ing.prix_unitaire,
                    "stock": ing.stock_disponible,
                    "unite": ing.unite
                } for ing in most_expensive
            ],
            "highest_stock": [
                {
                    "id": ing.id,
                    "nom": ing.nom,
                    "stock": ing.stock_disponible,
                    "unite": ing.unite,
                    "prix_unitaire": ing.prix_unitaire
                } for ing in highest_stock
            ]
        }
    except Exception as e:
        logger.error(f"Erreur lors du calcul des statistiques: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du calcul des statistiques")