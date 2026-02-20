from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Vente(Base):
    __tablename__ = "ventes"

    id = Column(Integer, primary_key=True, index=True)
    produit_id = Column(String, index=True)
    produit_nom = Column(String)
    quantite = Column(Float)
    prix_unitaire = Column(Float)
    montant_total = Column(Float)
    date = Column(DateTime(timezone=True), server_default=func.now())
    client = Column(String, nullable=True)
    mode_paiement = Column(String)
    commentaire = Column(String, nullable=True)