from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.ventes_schemas import Vente, VenteCreate
from app.repositories.ventes_repository import VentesRepository

router = APIRouter(prefix="/ventes", tags=["Ventes"])

def get_ventes_repo(db: Session = Depends(get_db)):
    return VentesRepository(db)

@router.get("/", response_model=List[Vente])
def get_ventes(repo: VentesRepository = Depends(get_ventes_repo)):
    return repo.get_ventes()

@router.post("/", response_model=Vente)
def create_vente(vente: VenteCreate, repo: VentesRepository = Depends(get_ventes_repo)):
    return repo.create_vente(vente)

@router.delete("/{vente_id}", status_code=204)
def delete_vente(vente_id: int, repo: VentesRepository = Depends(get_ventes_repo)):
    repo.delete_vente(vente_id)
    return {"message": "Vente supprimée avec succès"}