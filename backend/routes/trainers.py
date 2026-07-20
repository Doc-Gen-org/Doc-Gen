import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import Trainer, DocumentRecord
from services.trainer_counter import get_next_trainer_code
from services.trainer_utils import get_latest_trainer_document, get_trainer_documents_by_type
from services.email_sender import send_email_with_attachment
from services.email_templates import build_email_for_document_type
from services.generator import generate_document
from services.invoice_counter import get_next_invoice_number
from services.app_paths import UPLOADED_DOCUMENTS_DIR as UPLOADS_DIR, GENERATED_FILES_DIR

router = APIRouter()


class TrainerCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    pan: str | None = None
    aadhaar: str | None = None


class TrainerUpdate(BaseModel):
    email: str | None = None
    pan: str | None = None
    aadhaar: str | None = None
    payment_status: str | None = None
    paid_date: str | None = None


class GenerateInvoiceFromPORequest(BaseModel):
    attended_dates: list[str] | None = None


def _get_trainer_documents(db: Session, trainer: Trainer):
    records = get_trainer_documents_by_type(db, trainer, "po")
    matches = []
    for record in records:
        try:
            fields = json.loads(record.fields_json)
        except (json.JSONDecodeError, TypeError):
            fields = {}
        matches.append({
            "id": record.id,
            "po_number": fields.get("po_number") or "",
            "filename": record.filename,
            "output_format": record.output_format,
            "created_at": record.created_at.isoformat() if record.created_at else None,
        })
    return matches


def _serialize_trainer(t: Trainer, db: Session):
    return {
        "id": t.id,
        "trainer_code": t.trainer_code,
        "name": t.name,
        "email": t.email,
        "phone": t.phone,
        "pan": t.pan,
        "aadhaar": t.aadhaar,
        "payment_status": t.payment_status,
        "paid_date": t.paid_date,
        "documents": _get_trainer_documents(db, t),
    }


@router.get("/trainers")
def list_trainers(db: Session = Depends(get_db)):
    trainers = db.query(Trainer).all()
    return {"trainers": [_serialize_trainer(t, db) for t in trainers]}


@router.post("/trainers")
def create_trainer(request: TrainerCreate, db: Session = Depends(get_db)):
    trainer_code = get_next_trainer_code(db)

    trainer = Trainer(
        trainer_code=trainer_code,
        name=request.name,
        email=request.email,
        phone=request.phone,
        pan=request.pan,
        aadhaar=request.aadhaar,
        payment_status="Pending",
        paid_date=None,
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return _serialize_trainer(trainer, db)


@router.get("/trainers/{trainer_id}")
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})
    return _serialize_trainer(trainer, db)


@router.patch("/trainers/{trainer_id}")
def update_trainer(trainer_id: int, request: TrainerUpdate, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    if request.email is not None:
        trainer.email = request.email
    if request.pan is not None:
        trainer.pan = request.pan
    if request.aadhaar is not None:
        trainer.aadhaar = request.aadhaar
    if request.payment_status is not None:
        trainer.payment_status = request.payment_status
    if request.paid_date is not None:
        trainer.paid_date = request.paid_date

    db.commit()
    db.refresh(trainer)
    return _serialize_trainer(trainer, db)


@router.delete("/trainers/{trainer_id}")
def delete_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    linked_docs = db.query(DocumentRecord).filter(DocumentRecord.trainer_id == trainer.id).all()
    for doc in linked_docs:
        doc.trainer_id = None

    db.delete(trainer)
    db.commit()

    return {"message": f"Trainer {trainer_id} deleted successfully"}


@router.get("/trainers/{trainer_id}/documents/{doc_type}")
def list_trainer_documents_by_type(trainer_id: int, doc_type: str, db: Session = Depends(get_db)):
    if doc_type not in ("po", "invoice"):
        raise HTTPException(status_code=422, detail={"error": "doc_type must be 'po' or 'invoice'"})

    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    records = get_trainer_documents_by_type(db, trainer, doc_type)
    return {
        "documents": [
            {
                "id": r.id,
                "filename": r.filename,
                "output_format": r.output_format,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    }


@router.get("/trainers/{trainer_id}/documents/{doc_type}/{document_id}/preview")
def preview_trainer_document(trainer_id: int, doc_type: str, document_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(DocumentRecord.id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    media_type = "application/pdf" if record.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(path=file_path, media_type=media_type)


@router.post("/trainers/{trainer_id}/generate-invoice-from-po")
def generate_invoice_from_po(
    trainer_id: int,
    request: GenerateInvoiceFromPORequest,
    db: Session = Depends(get_db),
):
    """
    Auto-generates an invoice using data pulled from this trainer's
    most recent PO, plus manually-selected attended dates from the
    calendar picker (optional — omit for a fully blank date reference).
    """
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    po_record = get_latest_trainer_document(db, trainer, "po")
    if not po_record:
        raise HTTPException(
            status_code=404,
            detail={"error": "No PO found for this trainer — generate a PO first."},
        )

    try:
        po_fields = json.loads(po_record.fields_json)
    except Exception:
        po_fields = {}

    invoice_fields = {
        "trainer_name": trainer.name,
        "po_number": po_fields.get("po_number") or "",
        "technology": po_fields.get("technology") or "",
        "invoice_number": get_next_invoice_number(db),
        "attended_dates": request.attended_dates or [],
    }

    try:
        file_path = generate_document("invoice", "aca-technologies", "docx", invoice_fields)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Invoice generation failed: {str(e)}"})

    filename = os.path.basename(file_path)

    record = DocumentRecord(
        document_type="invoice",
        company_id="aca-technologies",
        output_format="docx",
        filename=filename,
        fields_json=json.dumps(invoice_fields),
        source_document_id=None,
        trainer_id=trainer.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "filename": record.filename,
        "output_format": record.output_format,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@router.post("/trainers/{trainer_id}/send-document-by-id")
def send_document_by_id(trainer_id: int, document_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    if not trainer.email:
        raise HTTPException(
            status_code=422,
            detail={"error": "This trainer has no email address on file — add one before sending."},
        )

    record = db.query(DocumentRecord).filter(DocumentRecord.id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "Generated file no longer exists on disk"})

    try:
        fields = json.loads(record.fields_json)
    except Exception:
        fields = {}

    reference_number = fields.get("po_number") if record.document_type == "po" else fields.get("invoice_number")
    subject, body = build_email_for_document_type(record.document_type, trainer.name, reference_number)

    try:
        send_email_with_attachment(
            db=db,
            to_email=trainer.email,
            subject=subject,
            body=body,
            attachment_path=file_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Email sending failed: {str(e)}"})

    return {"status": "sent", "to": trainer.email, "trainer_id": trainer.id, "document_id": record.id}


@router.post("/trainers/{trainer_id}/send-document")
async def send_document_to_trainer(
    trainer_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    if not trainer.email:
        raise HTTPException(
            status_code=422,
            detail={"error": "This trainer has no email address on file — add one before sending."},
        )

    allowed_extensions = {"pdf", "docx"}
    extension = file.filename.lower().split(".")[-1]
    if extension not in allowed_extensions:
        raise HTTPException(status_code=422, detail={"error": "Only PDF or DOCX files are allowed"})

    saved_filename = f"{doc_type}_{trainer.trainer_code}_{uuid.uuid4().hex[:8]}.{extension}"
    saved_path = os.path.join(UPLOADS_DIR, saved_filename)

    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    subject, body = build_email_for_document_type(doc_type, trainer.name)

    try:
        send_email_with_attachment(
            db=db,
            to_email=trainer.email,
            subject=subject,
            body=body,
            attachment_path=saved_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Email sending failed: {str(e)}"})

    return {"status": "sent", "to": trainer.email, "trainer_id": trainer.id, "doc_type": doc_type}