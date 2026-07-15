import os
import uuid
from sqlalchemy.orm import Session
from models.schemas import ReceivedDocument, DocumentRecord

RECEIVED_DIR = os.path.join(os.path.dirname(__file__), "..", "received_documents")
os.makedirs(RECEIVED_DIR, exist_ok=True)


def save_received_document(db: Session, trainer_id: int, doc_type: str, original_filename: str, contents: bytes) -> ReceivedDocument:
    extension = original_filename.lower().split(".")[-1]
    stored_filename = f"received_{doc_type}_{trainer_id}_{uuid.uuid4().hex[:8]}.{extension}"
    stored_path = os.path.join(RECEIVED_DIR, stored_filename)

    with open(stored_path, "wb") as f:
        f.write(contents)

    record = ReceivedDocument(
        trainer_id=trainer_id,
        doc_type=doc_type,
        filename=stored_filename,
        original_filename=original_filename,
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
    """
    - po_ready: True if a PO has ever been generated for this trainer
      (checked directly against generated documents — no manual step needed).
    - invoice_received: True if a filled invoice has been manually
      uploaded back from the trainer.
    - process_complete: True only when payment is marked Paid AND
      both of the above are true.
    """
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