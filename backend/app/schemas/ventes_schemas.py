from pydantic import BaseModel
from datetime import datetime

class VenteBase(BaseModel):
    produit_id: str
    produit_nom: str
    quantite: float
    prix_unitaire: float
    montant_total: float
    client: str | None = None
    mode_paiement: str
    commentaire: str | None = None

class VenteCreate(VenteBase):
    pass

class Vente(VenteBase):
    id: int
    date: datetime

    class Config:
        orm_mode = True