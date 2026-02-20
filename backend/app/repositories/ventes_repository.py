from sqlalchemy.orm import Session
from app.models.ventes_models import Vente
from app.schemas.ventes_schemas import VenteCreate

class VentesRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_ventes(self):
        return self.db.query(Vente).all()

    def create_vente(self, vente: VenteCreate):
        db_vente = Vente(**vente.dict())
        self.db.add(db_vente)
        self.db.commit()
        self.db.refresh(db_vente)
        return db_vente

    def delete_vente(self, vente_id: int):
        db_vente = self.db.query(Vente).filter(Vente.id == vente_id).first()
        if db_vente:
            self.db.delete(db_vente)
            self.db.commit()
        return db_vente