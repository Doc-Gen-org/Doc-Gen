import os
import json
import uuid
from sqlalchemy.orm import Session
from models.schemas import ReceivedDocument, DocumentRecord
from services.invoice_finance_extraction import extract_finance_details
from services.app_paths import RECEIVED_DOCUMENTS_DIR as RECEIVED_DIR


def save_received_document(db: Session, trainer_id: int, doc_type: str, original_filename: str, contents: bytes) -> ReceivedDocument:
    extension = original_filename.lower().split(".")[-1]
    stored_filename = f"received_{doc_type}_{trainer_id}_{uuid.uuid4().hex[:8]}.{extension}"
    stored_path = os.path.join(RECEIVED_DIR, stored_filename)

    with open(stored_path, "wb") as f:
        f.write(contents)

    finance_details_json = None
    if doc_type == "invoice":
        try:
            details = extract_finance_details(stored_path)
            finance_details_json = json.dumps(details) if details else None
        except Exception:
            # Extraction failing should never block the upload itself
            finance_details_json = None

    record = ReceivedDocument(
        trainer_id=trainer_id,
        doc_type=doc_type,
        filename=stored_filename,
        original_filename=original_filename,
        finance_details_json=finance_details_json,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_received_documents(db: Session, trainer_id: int, doc_type: str | None = None) -> list[ReceivedDocument]:
    query = db.query(ReceivedDocument).filter(ReceivedDocument.trainer_id == trainer_id)
    if doc_type:
        query = query.filter(ReceivedDocument.doc_type == doc_type)
    return query.order_by(ReceivedDocument.uploaded_at.desc()).all()


def get_trainer_status(db: Session, trainer) -> dict:
    po_ready = (
        db.query(DocumentRecord)
        .filter(DocumentRecord.document_type == "po", DocumentRecord.trainer_id == trainer.id)
        .first()
        is not None
    )
    invoice_received = (
        db.query(ReceivedDocument)
        .filter(ReceivedDocument.trainer_id == trainer.id, ReceivedDocument.doc_type == "invoice")
        .first()
        is not None
    )
    process_complete = trainer.payment_status == "Paid" and po_ready and invoice_received

    return {
        "po_ready": po_ready,
        "invoice_received": invoice_received,
        "process_complete": process_complete,
    }


def get_latest_finance_details(db: Session, trainer_id: int) -> dict | None:
    """
    Returns the finance details extracted from the most recently
    uploaded filled invoice for this trainer, or None if nothing's
    been uploaded yet or extraction found nothing.
    """
    latest = (
        db.query(ReceivedDocument)
        .filter(ReceivedDocument.trainer_id == trainer_id, ReceivedDocument.doc_type == "invoice")
        .order_by(ReceivedDocument.uploaded_at.desc())
        .first()
    )
    if not latest or not latest.finance_details_json:
        return None

    try:
        return json.loads(latest.finance_details_json)
    except json.JSONDecodeError:
        return None