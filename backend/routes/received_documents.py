import os
import json
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import Trainer, ReceivedDocument, CompanyAccount, DocumentRecord
from services.received_documents import (
    save_received_document,
    get_received_documents,
    get_trainer_status,
    get_latest_finance_details,
    RECEIVED_DIR,
)
from services.invoice_finance_extraction import (
    extract_finance_details_from_pdf,
    extract_invoice_amounts_from_pdf,
    modify_uploaded_invoice_docx,
    _parse_amount,
    _fmt_amount,
)
from services.generator import generate_document, _sanitize_filename_part
from services.invoice_counter import get_next_invoice_number
from services.app_paths import GENERATED_FILES_DIR

router = APIRouter()


@router.get("/trainers/{trainer_id}/received")
def list_received_documents(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    docs = get_received_documents(db, trainer_id, doc_type="invoice")
    return {
        "documents": [
            {
                "id": d.id,
                "doc_type": d.doc_type,
                "original_filename": d.original_filename,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ]
    }


@router.get("/trainers/{trainer_id}/status")
def trainer_status(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    return get_trainer_status(db, trainer)


@router.get("/trainers/{trainer_id}/finance-details")
def trainer_finance_details(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    details = get_latest_finance_details(db, trainer_id)
    return {"details": details}


@router.post("/trainers/{trainer_id}/received")
async def upload_received_document(
    trainer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    allowed_extensions = {"pdf", "docx"}
    extension = file.filename.lower().split(".")[-1]
    if extension not in allowed_extensions:
        raise HTTPException(status_code=422, detail={"error": "Only PDF or DOCX files are allowed"})

    contents = await file.read()
    record = save_received_document(db, trainer_id, "invoice", file.filename, contents)

    return {
        "id": record.id,
        "doc_type": record.doc_type,
        "original_filename": record.original_filename,
        "uploaded_at": record.uploaded_at.isoformat() if record.uploaded_at else None,
    }


@router.get("/trainers/{trainer_id}/received/{document_id}/download")
def download_received_document(trainer_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(ReceivedDocument).filter(
        ReceivedDocument.id == document_id, ReceivedDocument.trainer_id == trainer_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(RECEIVED_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    media_type = "application/pdf" if record.filename.lower().endswith(".pdf") else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(path=file_path, media_type=media_type, filename=record.original_filename)


@router.delete("/trainers/{trainer_id}/received/{document_id}")
def delete_received_document(trainer_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(ReceivedDocument).filter(
        ReceivedDocument.id == document_id, ReceivedDocument.trainer_id == trainer_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(RECEIVED_DIR, record.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(record)
    db.commit()

    return {"message": "Deleted successfully"}


class GenerateAcaInvoiceRequest(BaseModel):
    account_id: int
    rate_per_day: float | None = None


@router.post("/trainers/{trainer_id}/received/{document_id}/generate-aca-invoice")
def generate_aca_invoice(
    trainer_id: int,
    document_id: int,
    request: GenerateAcaInvoiceRequest,
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    received = db.query(ReceivedDocument).filter(
        ReceivedDocument.id == document_id, ReceivedDocument.trainer_id == trainer_id
    ).first()
    if not received:
        raise HTTPException(status_code=404, detail={"error": "Received document not found"})

    account = db.query(CompanyAccount).filter(CompanyAccount.id == request.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail={"error": "Company account not found"})

    source_path = os.path.join(RECEIVED_DIR, received.filename)
    if not os.path.exists(source_path):
        raise HTTPException(status_code=422, detail={"error": "Uploaded file no longer exists on disk"})

    extension = received.filename.lower().rsplit(".", 1)[-1]
    date_str = date.today().strftime("%Y%m%d")
    code = uuid.uuid4().hex[:6]
    output_filename = f"{_sanitize_filename_part(trainer.name)}_aca_invoice_{date_str}_{code}.{extension}"
    output_path = os.path.join(GENERATED_FILES_DIR, output_filename)

    try:
        if extension == "docx":
            # Direct edit: copy the trainer's DOCX, swap bank cells, replace the
            # per-day rate, and recompute the training amount + total.
            modify_uploaded_invoice_docx(source_path, output_path, account, request.rate_per_day)
            output_format = "docx"
        else:
            # PDF: extract data from the uploaded PDF, apply the new per-day rate,
            # recompute the total, then re-render via the HTML template with ACA's
            # bank details replacing the trainer's.
            extracted = extract_finance_details_from_pdf(source_path)
            amounts = extract_invoice_amounts_from_pdf(source_path)

            latest_po = (
                db.query(DocumentRecord)
                .filter(DocumentRecord.document_type == "po", DocumentRecord.trainer_id == trainer_id)
                .order_by(DocumentRecord.id.desc())
                .first()
            )
            po_fields: dict = {}
            if latest_po:
                try:
                    po_fields = json.loads(latest_po.fields_json)
                except Exception:
                    pass

            rate = _parse_amount(request.rate_per_day) or 0.0
            days = amounts.get("training_days")
            if days is None:
                days = _parse_amount(extracted.get("Training Days", ""))
            days = days or 0.0
            travel = amounts.get("travel_amount") or 0.0
            food = amounts.get("food_amount") or 0.0
            accommodation = amounts.get("accommodation_amount") or 0.0
            training_amount = days * rate
            total = training_amount + travel + food + accommodation

            invoice_fields = {
                "trainer_name": trainer.name,
                "po_number": po_fields.get("po_number") or "",
                "technology": po_fields.get("technology") or "",
                "invoice_number": extracted.get("Invoice Number") or get_next_invoice_number(db),
                "invoice_date": date.today().strftime("%d/%m/%Y"),
                "attended_dates_display": amounts.get("attend_date") or "",
                "attended_dates_count": int(days) if days else "",
                "training_days": _fmt_amount(days) if days else "",
                "rate_per_day": _fmt_amount(rate) if rate else "",
                "training_amount": _fmt_amount(training_amount) if training_amount else "",
                "travel_amount": _fmt_amount(travel) if travel else "",
                "food_amount": _fmt_amount(food) if food else "",
                "accommodation_amount": _fmt_amount(accommodation) if accommodation else "",
                "total_amount": _fmt_amount(total) if total else "",
                "account_holder_name": account.account_holder_name,
                "bank_name": account.bank_name or "",
                "account_number": account.account_number,
                "ifsc_code": account.ifsc_code or "",
                "pan_number": account.pan_number or "",
                "mode_of_payment": account.mode_of_payment or "",
            }
            pdf_path = generate_document("invoice", "aca-technologies", "pdf", invoice_fields)
            output_format = "pdf"
            output_filename = os.path.basename(pdf_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Generation failed: {str(e)}"})

    doc_record = DocumentRecord(
        document_type="invoice",
        company_id="aca-technologies",
        output_format=output_format,
        filename=output_filename,
        fields_json=json.dumps({"account_id": request.account_id}),
        trainer_id=trainer_id,
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    return {"id": doc_record.id, "filename": output_filename}


@router.get("/trainers/{trainer_id}/aca-invoice/{doc_record_id}/download")
def download_aca_invoice(trainer_id: int, doc_record_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(
        DocumentRecord.id == doc_record_id, DocumentRecord.trainer_id == trainer_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    ext = record.filename.rsplit(".", 1)[-1].lower()
    media_type = (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if ext == "docx"
        else "application/pdf"
    )
    return FileResponse(path=file_path, media_type=media_type, filename=record.filename)