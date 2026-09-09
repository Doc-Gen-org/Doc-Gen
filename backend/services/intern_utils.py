import json
from sqlalchemy.orm import Session
from models.schemas import DocumentRecord


def find_latest_certificate_for_intern(db: Session, intern_name: str) -> DocumentRecord | None:
    """
    Certificates are generated in Creator, which has no concept of the
    Intern roster and is intentionally left untouched by this feature —
    so certificates aren't linked via a foreign key. Instead, find the
    most recent certificate whose stored intern_name field matches this
    intern by name (case-insensitive, trimmed), same fallback-matching
    approach already used for unlinked invoices in trainer_utils.py.
    """
    normalized = intern_name.strip().lower()

    candidates = (
        db.query(DocumentRecord)
        .filter(DocumentRecord.document_type == "certificate")
        .order_by(DocumentRecord.created_at.desc())
        .all()
    )

    for record in candidates:
        try:
            fields = json.loads(record.fields_json)
        except (json.JSONDecodeError, TypeError):
            continue
        if (fields.get("intern_name") or "").strip().lower() == normalized:
            return record

    return None