import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from models.database import get_db
from models.schemas import Intern, DocumentRecord
from services.intern_counter import get_next_intern_code
from services.intern_utils import find_latest_certificate_for_intern
from services.generator import generate_document
from services.email_sender import send_email_with_attachment
from services.email_templates import build_offer_letter_email, build_internship_completion_email
from services.app_paths import GENERATED_FILES_DIR

router = APIRouter()


class InternCreate(BaseModel):
    name: str
    email: str
    institution: str | None = None
    phone: str | None = None


class InternUpdate(BaseModel):
    email: str | None = None
    institution: str | None = None
    phone: str | None = None


class GenerateOfferLetterRequest(BaseModel):
    role: str
    department: str
    start_date: str
    duration: str
    work_mode: str
    acceptance_deadline: str
    internship_type: str = "Internship"
    letter_date: str | None = None


class GenerateCertificateRequest(BaseModel):
    student_id: str
    degree_year: str
    institution_name: str
    institution_location: str
    start_date: str
    duration: str
    contribution_summary: str
    certificate_date: str | None = None


def _latest_document(db: Session, intern_id: int, document_type: str) -> DocumentRecord | None:
    return (
        db.query(DocumentRecord)
        .filter(DocumentRecord.intern_id == intern_id, DocumentRecord.document_type == document_type)
        .order_by(DocumentRecord.created_at.desc())
        .first()
    )


def _serialize_document(record: DocumentRecord | None):
    if not record:
        return None
    return {"id": record.id, "filename": record.filename}


def _serialize_intern(i: Intern, db: Session):
    offer_doc = _latest_document(db, i.id, "offer_letter")
    cert_doc = _latest_document(db, i.id, "certificate")
    return {
        "id": i.id,
        "intern_code": i.intern_code,
        "name": i.name,
        "email": i.email,
        "institution": i.institution,
        "phone": i.phone,
        "offer_sent_at": i.offer_sent_at,
        "certificate_sent_at": i.certificate_sent_at,
        "offer_letter_document": _serialize_document(offer_doc),
        "certificate_document": _serialize_document(cert_doc),
    }


@router.get("/interns")
def list_interns(db: Session = Depends(get_db)):
    interns = db.query(Intern).all()
    return {"interns": [_serialize_intern(i, db) for i in interns]}


@router.post("/interns")
def create_intern(request: InternCreate, db: Session = Depends(get_db)):
    intern = Intern(
        intern_code=get_next_intern_code(db),
        name=request.name,
        email=request.email,
        institution=request.institution,
        phone=request.phone,
    )
    db.add(intern)
    db.commit()
    db.refresh(intern)
    return _serialize_intern(intern, db)


@router.patch("/interns/{intern_id}")
def update_intern(intern_id: int, request: InternUpdate, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    if request.email is not None:
        intern.email = request.email
    if request.institution is not None:
        intern.institution = request.institution
    if request.phone is not None:
        intern.phone = request.phone

    db.commit()
    db.refresh(intern)
    return _serialize_intern(intern, db)


@router.delete("/interns/{intern_id}")
def delete_intern(intern_id: int, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    linked_docs = db.query(DocumentRecord).filter(DocumentRecord.intern_id == intern.id).all()
    for doc in linked_docs:
        doc.intern_id = None

    db.delete(intern)
    db.commit()
    return {"message": f"Intern {intern_id} deleted successfully"}


@router.post("/interns/{intern_id}/generate-offer-letter")
def generate_offer_letter(intern_id: int, request: GenerateOfferLetterRequest, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    letter_date = request.letter_date or datetime.now().strftime("%B %d, %Y")

    fields = {
        "letter_date": letter_date,
        "intern_name": intern.name,
        "institution": intern.institution or "",
        "intern_email": intern.email,
        "intern_phone": intern.phone or "",
        "role": request.role,
        "department": request.department,
        "internship_type": request.internship_type,
        "start_date": request.start_date,
        "duration": request.duration,
        "work_mode": request.work_mode,
        "acceptance_deadline": request.acceptance_deadline,
    }

    try:
        file_path = generate_document("offer_letter", "aca-technologies", "pdf", fields)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Offer letter generation failed: {str(e)}"})

    filename = os.path.basename(file_path)

    record = DocumentRecord(
        document_type="offer_letter",
        company_id="aca-technologies",
        output_format="pdf",
        filename=filename,
        fields_json=json.dumps(fields),
        source_document_id=None,
        intern_id=intern.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "filename": record.filename}


@router.post("/interns/{intern_id}/generate-certificate")
def generate_certificate(intern_id: int, request: GenerateCertificateRequest, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    certificate_date = request.certificate_date or datetime.now().strftime("%Y-%m-%d")

    fields = {
        "intern_name": intern.name,
        "student_id": request.student_id,
        "degree_year": request.degree_year,
        "institution_name": request.institution_name,
        "institution_location": request.institution_location,
        "start_date": request.start_date,
        "duration": request.duration,
        "contribution_summary": request.contribution_summary,
        "certificate_date": certificate_date,
    }

    try:
        file_path = generate_document("certificate", "aca-technologies", "pdf", fields)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Certificate generation failed: {str(e)}"})

    filename = os.path.basename(file_path)

    record = DocumentRecord(
        document_type="certificate",
        company_id="aca-technologies",
        output_format="pdf",
        filename=filename,
        fields_json=json.dumps(fields),
        source_document_id=None,
        intern_id=intern.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "filename": record.filename}


@router.post("/interns/{intern_id}/send-offer-letter")
def send_offer_letter(intern_id: int, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    if not intern.email:
        raise HTTPException(status_code=422, detail={"error": "This intern has no email address on file."})

    record = _latest_document(db, intern.id, "offer_letter")
    if not record:
        raise HTTPException(status_code=404, detail={"error": "No offer letter generated yet for this intern. Generate it first."})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "The offer letter file no longer exists on disk."})

    try:
        fields = json.loads(record.fields_json)
    except (json.JSONDecodeError, TypeError):
        fields = {}

    subject, body = build_offer_letter_email(
        intern.name,
        fields.get("role", ""),
        fields.get("department", ""),
        fields.get("start_date", ""),
        fields.get("duration", ""),
        fields.get("work_mode", ""),
        fields.get("acceptance_deadline", ""),
    )

    try:
        send_email_with_attachment(
            db=db,
            to_email=intern.email,
            subject=subject,
            body=body,
            attachment_path=file_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Email sending failed: {str(e)}"})

    intern.offer_sent_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    db.commit()

    return {"status": "sent", "to": intern.email, "intern_id": intern.id, "document_id": record.id}


@router.post("/interns/{intern_id}/send-certificate")
def send_certificate(intern_id: int, db: Session = Depends(get_db)):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if not intern:
        raise HTTPException(status_code=404, detail={"error": "Intern not found"})

    if not intern.email:
        raise HTTPException(status_code=422, detail={"error": "This intern has no email address on file."})

    # Prefer a certificate generated from this page (properly linked by ID).
    # Fall back to name-matching for certificates generated the old way,
    # via Creator, before this page existed.
    certificate_record = _latest_document(db, intern.id, "certificate")
    if not certificate_record:
        certificate_record = find_latest_certificate_for_intern(db, intern.name)

    if not certificate_record:
        raise HTTPException(
            status_code=404,
            detail={"error": "No certificate generated yet for this intern. Generate it first."},
        )

    file_path = os.path.join(GENERATED_FILES_DIR, certificate_record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "The certificate file no longer exists on disk."})

    try:
        cert_fields = json.loads(certificate_record.fields_json)
    except (json.JSONDecodeError, TypeError):
        cert_fields = {}

    contribution_summary = cert_fields.get("contribution_summary")

    subject, body = build_internship_completion_email(intern.name, contribution_summary)

    try:
        send_email_with_attachment(
            db=db,
            to_email=intern.email,
            subject=subject,
            body=body,
            attachment_path=file_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Email sending failed: {str(e)}"})

    intern.certificate_sent_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    db.commit()

    return {"status": "sent", "to": intern.email, "intern_id": intern.id, "document_id": certificate_record.id}


@router.get("/interns/{intern_id}/documents/{document_id}/preview")
def preview_intern_document(intern_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(DocumentRecord.id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    media_type = "application/pdf" if record.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(path=file_path, media_type=media_type)