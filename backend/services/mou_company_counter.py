from sqlalchemy.orm import Session
from models.schemas import MouCompanyCounter


def get_next_company_code(db: Session) -> str:
    counter = db.query(MouCompanyCounter).first()
    if not counter:
        counter = MouCompanyCounter(last_number=0)
        db.add(counter)
        db.flush()

    counter.last_number += 1
    db.commit()
    db.refresh(counter)

    return f"MOU-{counter.last_number:04d}"