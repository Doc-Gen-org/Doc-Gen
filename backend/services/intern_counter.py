from sqlalchemy.orm import Session
from models.schemas import InternCounter


def get_next_intern_code(db: Session) -> str:
    """
    Atomically increments and returns the next intern code,
    formatted as INT-0001, INT-0002, etc. Creates the counter
    row on first use if it doesn't exist yet.
    """
    counter = db.query(InternCounter).first()
    if not counter:
        counter = InternCounter(last_number=0)
        db.add(counter)
        db.flush()

    counter.last_number += 1
    db.commit()
    db.refresh(counter)

    return f"INT-{counter.last_number:04d}"