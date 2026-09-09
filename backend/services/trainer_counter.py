from sqlalchemy.orm import Session
from models.schemas import TrainerCounter


def get_next_trainer_code(db: Session) -> str:
    """
    Atomically increments and returns the next trainer code,
    formatted as TRN-0001, TRN-0002, etc. Creates the counter
    row on first use if it doesn't exist yet.
    """
    counter = db.query(TrainerCounter).first()
    if not counter:
        counter = TrainerCounter(last_number=0)
        db.add(counter)
        db.flush()

    counter.last_number += 1
    db.commit()
    db.refresh(counter)

    return f"TRN-{counter.last_number:04d}"