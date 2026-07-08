from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import Trainer

router = APIRouter()


class TrainerCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None


@router.get("/trainers")
def list_trainers(db: Session = Depends(get_db)):
    trainers = db.query(Trainer).all()
    return {
        "trainers": [
            {"id": t.id, "name": t.name, "email": t.email, "phone": t.phone}
            for t in trainers
        ]
    }


@router.post("/trainers")
def create_trainer(request: TrainerCreate, db: Session = Depends(get_db)):
    trainer = Trainer(name=request.name, email=request.email, phone=request.phone)
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return {"id": trainer.id, "name": trainer.name, "email": trainer.email, "phone": trainer.phone}


@router.get("/trainers/{trainer_id}")
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})
    return {"id": trainer.id, "name": trainer.name, "email": trainer.email, "phone": trainer.phone}