from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Categorie(Base):
    """Modèle pour les catégories de produits (ex: Burgers, Boissons, Desserts)"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relation avec les produits
    produits = relationship("Produit", back_populates="categorie")

class Produit(Base):
    """Modèle pour les produits du menu"""
    __tablename__ = "produits"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(200), nullable=False)
    reference = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    prix = Column(Float, nullable=False)
    categorie_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    disponible = Column(String(10), default="disponible")  # disponible, indisponible
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    categorie = relationship("Categorie", back_populates="produits")
    recette = relationship("Recette", back_populates="produit", uselist=False)

class Ingredient(Base):
    """Modèle pour les ingrédients disponibles"""
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    unite = Column(String(20), nullable=False)  # kg, L, unité, etc.
    stock_disponible = Column(Float, default=0.0)
    prix_unitaire = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    recette_ingredients = relationship("RecetteIngredient", back_populates="ingredient")

class Recette(Base):
    """Modèle pour les recettes des produits"""
    __tablename__ = "recettes"
    
    id = Column(Integer, primary_key=True, index=True)
    produit_id = Column(Integer, ForeignKey("produits.id"), unique=True, nullable=False)
    instructions = Column(Text, nullable=True)
    temps_preparation = Column(Integer, default=0)  # en minutes
    difficulte = Column(String(20), default="facile")  # facile, moyen, difficile
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    produit = relationship("Produit", back_populates="recette")
    ingredients = relationship("RecetteIngredient", back_populates="recette")

class RecetteIngredient(Base):
    """Table de liaison entre recettes et ingrédients avec quantités"""
    __tablename__ = "recette_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recette_id = Column(Integer, ForeignKey("recettes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantite = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    recette = relationship("Recette", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recette_ingredients") 