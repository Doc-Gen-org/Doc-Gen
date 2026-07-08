import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import Company, DocumentRecord
from config.document_types import DOCUMENT_TYPES
from services.generator import generate_document
from services.invoice_counter import get_next_invoice_number
from pydantic import BaseModel
from typing import Any, Dict

router = APIRouter()


@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    return {
        "companies": [
            {"id": c.id, "name": c.name} for c in companies
        ]
    }


@router.get("/document-types")
def get_document_types():
    return {"document_types": DOCUMENT_TYPES}


class GenerateRequest(BaseModel):
    document_type: str
    company_id: str
    output_format: str
    fields: Dict[str, Any]


@router.post("/generate")
def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    fields = dict(request.fields)

    # Auto-assign a unique invoice number for every generated invoice
    if request.document_type == "invoice":
        fields["invoice_number"] = get_next_invoice_number(db)

    try:
        file_path = generate_document(
            request.document_type,
            request.company_id,
            request.output_format,
            fields,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=422, detail={"error": str(e)})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Generation failed: {str(e)}"})

    filename = os.path.basename(file_path)

    record = DocumentRecord(
        document_type=request.document_type,
        company_id=request.company_id,
        output_format=request.output_format,
        filename=filename,
        fields_json=json.dumps(fields),
        source_document_id=None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    media_type = "application/pdf" if request.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
        headers={"X-Document-Id": str(record.id)},
    )