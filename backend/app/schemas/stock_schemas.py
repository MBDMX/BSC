from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class IngredientBase(BaseModel):
    nom: str = Field(..., min_length=1, max_length=100, description="Nom de l'ingrédient")
    unite: str = Field(..., min_length=1, max_length=20, description="Unité de mesure (kg, L, unité, etc.)")
    stock_disponible: float = Field(..., ge=0, description="Quantité en stock")
    prix_unitaire: float = Field(..., ge=0, description="Prix unitaire")

    @validator('nom')
    def nom_must_be_valid(cls, v):
        if not v.strip():
            raise ValueError('Le nom ne peut pas être vide')
        return v.strip()

    @validator('unite')
    def unite_must_be_valid(cls, v):
        valid_unites = ['kg', 'g', 'L', 'ml', 'unité', 'pièce', 'paquet', 'boîte']
        if v.lower() not in valid_unites:
            raise ValueError(f'Unité invalide. Unités valides: {", ".join(valid_unites)}')
        return v.lower()

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    unite: Optional[str] = Field(None, min_length=1, max_length=20)
    stock_disponible: Optional[float] = Field(None, ge=0)
    prix_unitaire: Optional[float] = Field(None, ge=0)

    @validator('nom')
    def nom_must_be_valid(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Le nom ne peut pas être vide')
        return v.strip() if v else v

    @validator('unite')
    def unite_must_be_valid(cls, v):
        if v is not None:
            valid_unites = ['kg', 'g', 'L', 'ml', 'unité', 'pièce', 'paquet', 'boîte']
            if v.lower() not in valid_unites:
                raise ValueError(f'Unité invalide. Unités valides: {", ".join(valid_unites)}')
            return v.lower()
        return v

class IngredientResponse(IngredientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockMovement(BaseModel):
    type: str = Field(..., description="Type de mouvement: 'entree' ou 'sortie'")
    quantite: float = Field(..., gt=0, description="Quantité à ajouter ou retirer")
    raison: Optional[str] = Field(None, max_length=200, description="Raison du mouvement")
    date_mouvement: Optional[datetime] = Field(default_factory=datetime.now)

    @validator('type')
    def type_must_be_valid(cls, v):
        if v not in ['entree', 'sortie']:
            raise ValueError('Le type doit être "entree" ou "sortie"')
        return v

    @validator('quantite')
    def quantite_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('La quantité doit être positive')
        return v

class StockAlert(BaseModel):
    ingredient_id: int
    ingredient_nom: str
    stock_actuel: float
    seuil_alerte: float
    unite: str
    niveau_urgence: str = Field(..., description="'critique' ou 'attention'")

    @validator('niveau_urgence')
    def niveau_urgence_must_be_valid(cls, v):
        if v not in ['critique', 'attention']:
            raise ValueError('Le niveau d\'urgence doit être "critique" ou "attention"')
        return v

class StockStatistics(BaseModel):
    total_ingredients: int
    total_stock_value: float
    avg_value_per_ingredient: float
    low_stock_count: int
    most_expensive: List[dict]
    highest_stock: List[dict]

class IngredientWithAlerts(IngredientResponse):
    alertes: List[StockAlert] = []

class StockMovementResponse(BaseModel):
    message: str
    nouveau_stock: float
    ingredient: IngredientResponse 