from sqlalchemy.orm import Session
from models.schemas import FinanceRecord
from collections import defaultdict


def create_finance_record(db: Session, entry_type: str, amount: float, date: str, notes: str | None) -> FinanceRecord:
    record = FinanceRecord(
        entry_type=entry_type,
        amount=amount,
        date=date,
        notes=notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_finance_records(db: Session) -> list[FinanceRecord]:
    return db.query(FinanceRecord).order_by(FinanceRecord.date.desc()).all()


def delete_finance_record(db: Session, record_id: int) -> bool:
    record = db.query(FinanceRecord).filter(FinanceRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_finance_summary(db: Session) -> dict:
    records = list_finance_records(db)

    total_received = sum(r.amount for r in records if r.entry_type == "received")
    total_paid = sum(r.amount for r in records if r.entry_type == "paid")
    net_profit = total_received - total_paid

    by_day = defaultdict(lambda: {"received": 0.0, "paid": 0.0})
    by_month = defaultdict(lambda: {"received": 0.0, "paid": 0.0})
    for r in records:
        by_day[r.date][r.entry_type] += r.amount
        by_month[r.date[:7]][r.entry_type] += r.amount

    daily = sorted(
        [{"date": d, "received": v["received"], "paid": v["paid"], "profit": v["received"] - v["paid"]} for d, v in by_day.items()],
        key=lambda x: x["date"],
    )
    monthly = sorted(
        [{"month": m, "received": v["received"], "paid": v["paid"], "profit": v["received"] - v["paid"]} for m, v in by_month.items()],
        key=lambda x: x["month"],
    )

    return {
        "total_received": total_received,
        "total_paid": total_paid,
        "net_profit": net_profit,
        "daily": daily,
        "monthly": monthly,
    }