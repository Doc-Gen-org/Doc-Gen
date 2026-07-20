import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import MouCompany, DocumentRecord
from services.mou_company_counter import get_next_company_code
from services.app_paths import GENERATED_FILES_DIR

router = APIRouter()


class MouCompanyCreate(BaseModel):
    name: str
    address: str | None = None
    signatory_name: str | None = None
    signatory_title: str | None = None
    email: str | None = None
    pan: str | None = None
    trainer_contact: str | None = None


class MouCompanyUpdate(BaseModel):
    address: str | None = None
    signatory_name: str | None = None
    signatory_title: str | None = None
    email: str | None = None
    pan: str | None = None
    trainer_contact: str | None = None


def _get_company_mous(db: Session, company: MouCompany):
    records = (
        db.query(DocumentRecord)
        .filter(DocumentRecord.document_type == "mou", DocumentRecord.mou_company_id == company.id)
        .order_by(DocumentRecord.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "output_format": r.output_format,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


def _serialize_company(c: MouCompany, db: Session):
    return {
        "id": c.id,
        "company_code": c.company_code,
        "name": c.name,
        "address": c.address,
        "signatory_name": c.signatory_name,
        "signatory_title": c.signatory_title,
        "email": c.email,
        "pan": c.pan,
        "trainer_contact": c.trainer_contact,
        "documents": _get_company_mous(db, c),
    }


@router.get("/mou-companies")
def list_mou_companies(db: Session = Depends(get_db)):
    companies = db.query(MouCompany).all()
    return {"companies": [_serialize_company(c, db) for c in companies]}


@router.post("/mou-companies")
def create_mou_company(request: MouCompanyCreate, db: Session = Depends(get_db)):
    company = MouCompany(
        company_code=get_next_company_code(db),
        name=request.name,
        address=request.address,
        signatory_name=request.signatory_name,
        signatory_title=request.signatory_title,
        email=request.email,
        pan=request.pan,
        trainer_contact=request.trainer_contact,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return _serialize_company(company, db)


@router.get("/mou-companies/{company_id}")
def get_mou_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(MouCompany).filter(MouCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail={"error": "Company not found"})
    return _serialize_company(company, db)


@router.patch("/mou-companies/{company_id}")
def update_mou_company(company_id: int, request: MouCompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(MouCompany).filter(MouCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail={"error": "Company not found"})

    if request.address is not None:
        company.address = request.address
    if request.signatory_name is not None:
        company.signatory_name = request.signatory_name
    if request.signatory_title is not None:
        company.signatory_title = request.signatory_title
    if request.email is not None:
        company.email = request.email
    if request.pan is not None:
        company.pan = request.pan
    if request.trainer_contact is not None:
        company.trainer_contact = request.trainer_contact

    db.commit()
    db.refresh(company)
    return _serialize_company(company, db)


@router.delete("/mou-companies/{company_id}")
def delete_mou_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(MouCompany).filter(MouCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail={"error": "Company not found"})

    linked_docs = db.query(DocumentRecord).filter(DocumentRecord.mou_company_id == company.id).all()
    for doc in linked_docs:
        doc.mou_company_id = None

    db.delete(company)
    db.commit()

    return {"message": f"Company {company_id} deleted successfully"}


@router.get("/mou-companies/{company_id}/documents/{document_id}/preview")
def preview_mou_document(company_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(DocumentRecord.id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    media_type = "application/pdf" if record.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(path=file_path, media_type=media_type)