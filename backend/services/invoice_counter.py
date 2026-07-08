from sqlalchemy.orm import Session
from models.schemas import InvoiceCounter


def get_next_invoice_number(db: Session) -> str:
    """
    Atomically increments and returns the next invoice number,
    formatted as INV-0001, INV-0002, etc. Creates the counter
    row on first use if it doesn't exist yet.
    """
    counter = db.query(InvoiceCounter).first()
    if not counter:
        counter = InvoiceCounter(last_number=0)
        db.add(counter)
        db.flush()

    counter.last_number += 1
    db.commit()
    db.refresh(counter)

    return f"INV-{counter.last_number:04d}"