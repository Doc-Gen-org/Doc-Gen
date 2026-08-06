from sqlalchemy.orm import Session
from models.schemas import PoCounter


def get_next_po_number(db: Session) -> str:
    """
    Atomically increments and returns the next purchase order number,
    formatted as PO-ACA-0001, PO-ACA-0002, etc. Creates the counter
    row on first use if it doesn't exist yet.
    """
    counter = db.query(PoCounter).first()
    if not counter:
        counter = PoCounter(last_number=0)
        db.add(counter)
        db.flush()

    counter.last_number += 1
    db.commit()
    db.refresh(counter)

    return f"PO-ACA-{counter.last_number:04d}"
