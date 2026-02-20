from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu_schemas import (
    Categorie, CategorieCreate,
    Produit, ProduitCreate, ProduitComplet,
    Ingredient, IngredientCreate,
    Recette, RecetteCreate,
    MenuComplet
)

router = APIRouter(prefix="/menu", tags=["Menu"])

# === ENDPOINTS CATÉGORIES ===
@router.post("/categories/", response_model=Categorie, status_code=status.HTTP_201_CREATED)
def create_categorie(categorie: CategorieCreate, db: Session = Depends(get_db)):
    """Créer une nouvelle catégorie"""
    repo = MenuRepository(db)
    return repo.create_categorie(categorie)

@router.get("/categories/", response_model=List[Categorie])
def get_categories(db: Session = Depends(get_db)):
    """Récupérer toutes les catégories"""
    repo = MenuRepository(db)
    return repo.get_categories()

@router.get("/categories/{categorie_id}", response_model=Categorie)
def get_categorie(categorie_id: int, db: Session = Depends(get_db)):
    """Récupérer une catégorie par ID"""
    repo = MenuRepository(db)
    categorie = repo.get_categorie_by_id(categorie_id)
    if not categorie:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return categorie

@router.put("/categories/{categorie_id}", response_model=Categorie)
def update_categorie(categorie_id: int, categorie_data: dict, db: Session = Depends(get_db)):
    """Mettre à jour une catégorie"""
    repo = MenuRepository(db)
    categorie = repo.update_categorie(categorie_id, categorie_data)
    if not categorie:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return categorie

@router.delete("/categories/{categorie_id}")
def delete_categorie(categorie_id: int, db: Session = Depends(get_db)):
    """Supprimer une catégorie"""
    repo = MenuRepository(db)
    success = repo.delete_categorie(categorie_id)
    if not success:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return {"message": "Catégorie supprimée avec succès"}

# === ENDPOINTS INGRÉDIENTS ===
@router.post("/ingredients/", response_model=Ingredient, status_code=status.HTTP_201_CREATED)
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    """Créer un nouvel ingrédient"""
    repo = MenuRepository(db)
    return repo.create_ingredient(ingredient)

@router.get("/ingredients/", response_model=List[Ingredient])
def get_ingredients(db: Session = Depends(get_db)):
    """Récupérer tous les ingrédients"""
    repo = MenuRepository(db)
    return repo.get_ingredients()

@router.get("/ingredients/{ingredient_id}", response_model=Ingredient)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Récupérer un ingrédient par ID"""
    repo = MenuRepository(db)
    ingredient = repo.get_ingredient_by_id(ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    return ingredient

@router.put("/ingredients/{ingredient_id}", response_model=Ingredient)
def update_ingredient(ingredient_id: int, ingredient_data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un ingrédient"""
    repo = MenuRepository(db)
    ingredient = repo.update_ingredient(ingredient_id, ingredient_data)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    return ingredient

@router.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Supprimer un ingrédient"""
    repo = MenuRepository(db)
    success = repo.delete_ingredient(ingredient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ingrédient non trouvé")
    return {"message": "Ingrédient supprimé avec succès"}

# === ENDPOINTS PRODUITS ===
@router.post("/produits/", response_model=Produit, status_code=status.HTTP_201_CREATED)
def create_produit(produit: ProduitCreate, db: Session = Depends(get_db)):
    """Créer un nouveau produit avec sa recette"""
    repo = MenuRepository(db)
    return repo.create_produit(produit)

@router.get("/produits/", response_model=List[Produit])
def get_produits(db: Session = Depends(get_db)):
    """Récupérer tous les produits"""
    repo = MenuRepository(db)
    return repo.get_produits()

@router.get("/produits/{produit_id}", response_model=Produit)
def get_produit(produit_id: int, db: Session = Depends(get_db)):
    """Récupérer un produit par ID"""
    repo = MenuRepository(db)
    produit = repo.get_produit_by_id(produit_id)
    if not produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return produit

@router.get("/produits/reference/{reference}", response_model=Produit)
def get_produit_by_reference(reference: str, db: Session = Depends(get_db)):
    """Récupérer un produit par référence"""
    repo = MenuRepository(db)
    produit = repo.get_produit_by_reference(reference)
    if not produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return produit

@router.get("/produits/categorie/{categorie_id}", response_model=List[Produit])
def get_produits_by_categorie(categorie_id: int, db: Session = Depends(get_db)):
    """Récupérer tous les produits d'une catégorie"""
    repo = MenuRepository(db)
    return repo.get_produits_by_categorie(categorie_id)

@router.put("/produits/{produit_id}", response_model=Produit)
def update_produit(produit_id: int, produit_data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un produit"""
    repo = MenuRepository(db)
    produit = repo.update_produit(produit_id, produit_data)
    if not produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return produit

@router.delete("/produits/{produit_id}")
def delete_produit(produit_id: int, db: Session = Depends(get_db)):
    """Supprimer un produit"""
    repo = MenuRepository(db)
    success = repo.delete_produit(produit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return {"message": "Produit supprimé avec succès"}

# === ENDPOINTS RECETTES ===
@router.post("/produits/{produit_id}/recette", response_model=Recette, status_code=status.HTTP_201_CREATED)
def create_recette(produit_id: int, recette: RecetteCreate, db: Session = Depends(get_db)):
    """Créer une recette pour un produit"""
    repo = MenuRepository(db)
    # Vérifier que le produit existe
    produit = repo.get_produit_by_id(produit_id)
    if not produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return repo.create_recette(produit_id, recette)

@router.get("/produits/{produit_id}/recette", response_model=Recette)
def get_recette(produit_id: int, db: Session = Depends(get_db)):
    """Récupérer la recette d'un produit"""
    repo = MenuRepository(db)
    recette = repo.get_recette_by_produit_id(produit_id)
    if not recette:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    return recette

@router.put("/recettes/{recette_id}", response_model=Recette)
def update_recette(recette_id: int, recette_data: dict, db: Session = Depends(get_db)):
    """Mettre à jour une recette"""
    repo = MenuRepository(db)
    recette = repo.update_recette(recette_id, recette_data)
    if not recette:
        raise HTTPException(status_code=404, detail="Recette non trouvée")
    return recette

# === ENDPOINTS UTILITAIRES ===
@router.get("/complet", response_model=MenuComplet)
def get_menu_complet(db: Session = Depends(get_db)):
    """Récupérer le menu complet avec toutes les relations"""
    repo = MenuRepository(db)
    return repo.get_menu_complet()

@router.get("/recettes/{recette_id}/cout")
def calculer_cout_recette(recette_id: int, db: Session = Depends(get_db)):
    """Calculer le coût total d'une recette"""
    repo = MenuRepository(db)
    cout = repo.calculer_cout_recette(recette_id)
    return {"recette_id": recette_id, "cout_total": cout}

@router.get("/recettes/{recette_id}/stock")
def verifier_stock_recette(recette_id: int, db: Session = Depends(get_db)):
    """Vérifier la disponibilité des ingrédients d'une recette"""
    repo = MenuRepository(db)
    return repo.verifier_stock_ingredients(recette_id) 