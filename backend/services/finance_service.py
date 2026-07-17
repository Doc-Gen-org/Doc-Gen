from sqlalchemy.orm import Session
from models.schemas import FinanceRecord
from collections import defaultdict


def create_finance_record(db: Session, company_name: str, amount_received: float, receiving_date: str,
                           trainer_name: str, amount_sent: float, sending_date: str, notes: str | None) -> FinanceRecord:
    record = FinanceRecord(
        company_name=company_name.strip(),
        amount_received=amount_received,
        receiving_date=receiving_date,
        trainer_name=trainer_name.strip(),
        amount_sent=amount_sent,
        sending_date=sending_date,
        notes=notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_finance_records(db: Session) -> list[FinanceRecord]:
    return db.query(FinanceRecord).order_by(FinanceRecord.receiving_date.desc()).all()


def delete_finance_record(db: Session, record_id: int) -> bool:
    record = db.query(FinanceRecord).filter(FinanceRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def _profit(r: FinanceRecord) -> float:
    return r.amount_received - r.amount_sent


def get_finance_summary(db: Session) -> dict:
    records = list_finance_records(db)

    total_received = sum(r.amount_received for r in records)
    total_sent = sum(r.amount_sent for r in records)
    net_profit = total_received - total_sent

    by_company = defaultdict(lambda: {"received": 0.0, "sent": 0.0})
    for r in records:
        by_company[r.company_name]["received"] += r.amount_received
        by_company[r.company_name]["sent"] += r.amount_sent

    company_breakdown = [
        {"company_name": name, "received": v["received"], "sent": v["sent"], "profit": v["received"] - v["sent"]}
        for name, v in by_company.items()
    ]

    by_day = defaultdict(lambda: {"received": 0.0, "sent": 0.0})
    by_month = defaultdict(lambda: {"received": 0.0, "sent": 0.0})
    for r in records:
        by_day[r.receiving_date]["received"] += r.amount_received
        by_day[r.sending_date]["sent"] += r.amount_sent
        by_month[r.receiving_date[:7]]["received"] += r.amount_received
        by_month[r.sending_date[:7]]["sent"] += r.amount_sent

    daily = sorted(
        [{"date": d, "received": v["received"], "sent": v["sent"], "profit": v["received"] - v["sent"]} for d, v in by_day.items()],
        key=lambda x: x["date"],
    )
    monthly = sorted(
        [{"month": m, "received": v["received"], "sent": v["sent"], "profit": v["received"] - v["sent"]} for m, v in by_month.items()],
        key=lambda x: x["month"],
    )

    return {
        "total_received": total_received,
        "total_sent": total_sent,
        "net_profit": net_profit,
        "by_company": company_breakdown,
        "daily": daily,
        "monthly": monthly,
    }