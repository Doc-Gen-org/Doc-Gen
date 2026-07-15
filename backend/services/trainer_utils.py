import json
from sqlalchemy.orm import Session
from models.schemas import Trainer, DocumentRecord
from services.trainer_counter import get_next_trainer_code


def get_or_create_trainer_by_name(db: Session, trainer_name: str) -> Trainer | None:
    if not trainer_name or not trainer_name.strip():
        return None

    normalized = trainer_name.strip().lower()

    existing = db.query(Trainer).all()
    for t in existing:
        if t.name.strip().lower() == normalized:
            return t

    trainer = Trainer(
        trainer_code=get_next_trainer_code(db),
        name=trainer_name.strip(),
        email="",
        payment_status="Pending",
        paid_date=None,
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer


def get_trainer_documents_by_type(db: Session, trainer: Trainer, doc_type: str) -> list[DocumentRecord]:
    """
    Returns ALL documents of a given type (doc_type = "po" or "invoice")
    for this trainer, most recent first. Prefers the real trainer_id
    link; falls back to name-matching for older unlinked records.
    """
    linked = (
        db.query(DocumentRecord)
        .filter(DocumentRecord.document_type == doc_type, DocumentRecord.trainer_id == trainer.id)
        .order_by(DocumentRecord.created_at.desc())
        .all()
    )

    normalized = trainer.name.strip().lower()
    unlinked = (
        db.query(DocumentRecord)
        .filter(DocumentRecord.document_type == doc_type, DocumentRecord.trainer_id.is_(None))
        .order_by(DocumentRecord.created_at.desc())
        .all()
    )

    fallback_matches = []
    for record in unlinked:
        try:
            fields = json.loads(record.fields_json)
        except (json.JSONDecodeError, TypeError):
            continue
        if (fields.get("trainer_name") or "").strip().lower() == normalized:
            fallback_matches.append(record)

    return linked + fallback_matches


def get_latest_trainer_document(db: Session, trainer: Trainer, doc_type: str) -> DocumentRecord | None:
    docs = get_trainer_documents_by_type(db, trainer, doc_type)
    return docs[0] if docs else None