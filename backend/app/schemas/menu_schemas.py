from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Schémas pour les catégories
class CategorieBase(BaseModel):
    nom: str
    description: Optional[str] = None

class CategorieCreate(CategorieBase):
    pass

class Categorie(CategorieBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schémas pour les ingrédients
class IngredientBase(BaseModel):
    nom: str
    unite: str
    stock_disponible: float = 0.0
    prix_unitaire: float = 0.0

class IngredientCreate(IngredientBase):
    pass

class Ingredient(IngredientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schémas pour les recettes
class RecetteIngredientBase(BaseModel):
    ingredient_id: int
    quantite: float

class RecetteIngredientCreate(RecetteIngredientBase):
    pass

class RecetteIngredient(RecetteIngredientBase):
    id: int
    ingredient: Ingredient
    created_at: datetime

    class Config:
        from_attributes = True

class RecetteBase(BaseModel):
    instructions: Optional[str] = None
    temps_preparation: int = 0
    difficulte: str = "facile"

class RecetteCreate(RecetteBase):
    ingredients: List[RecetteIngredientCreate]

class Recette(RecetteBase):
    id: int
    produit_id: int
    ingredients: List[RecetteIngredient]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schémas pour les produits
class ProduitBase(BaseModel):
    nom: str
    reference: str
    description: Optional[str] = None
    prix: float
    categorie_id: int
    disponible: str = "disponible"

class ProduitCreate(ProduitBase):
    recette: Optional[RecetteCreate] = None

class Produit(ProduitBase):
    id: int
    categorie: Categorie
    recette: Optional[Recette] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schémas pour les réponses complètes
class ProduitComplet(BaseModel):
    id: int
    nom: str
    reference: str
    description: Optional[str] = None
    prix: float
    categorie: Categorie
    disponible: str
    recette: Optional[Recette] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MenuComplet(BaseModel):
    categories: List[Categorie]
    produits: List[ProduitComplet]
    ingredients: List[Ingredient] 