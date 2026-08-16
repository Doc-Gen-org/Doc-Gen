from sqlalchemy.orm import Session
from models.schemas import FinanceRecord, FinanceCategory
from collections import defaultdict


def create_finance_category(db: Session, name: str) -> FinanceCategory:
    category = FinanceCategory(name=name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_finance_categories(db: Session) -> list[dict]:
    categories = db.query(FinanceCategory).order_by(FinanceCategory.name).all()
    result = []
    for c in categories:
        records = db.query(FinanceRecord).filter(FinanceRecord.category_id == c.id).all()
        received = sum(r.amount for r in records if r.entry_type == "received")
        paid = sum(r.amount for r in records if r.entry_type == "paid")
        result.append({
            "id": c.id,
            "name": c.name,
            "record_count": len(records),
            "received": received,
            "paid": paid,
            "profit": received - paid,
        })
    return result


def rename_finance_category(db: Session, category_id: int, name: str) -> FinanceCategory | None:
    category = db.query(FinanceCategory).filter(FinanceCategory.id == category_id).first()
    if not category:
        return None
    category.name = name.strip()
    db.commit()
    db.refresh(category)
    return category


def delete_finance_category(db: Session, category_id: int) -> bool:
    category = db.query(FinanceCategory).filter(FinanceCategory.id == category_id).first()
    if not category:
        return False
    db.query(FinanceRecord).filter(FinanceRecord.category_id == category_id).delete()
    db.delete(category)
    db.commit()
    return True


def create_finance_record(db: Session, category_id: int, entry_type: str, amount: float, date: str, notes: str | None) -> FinanceRecord:
    record = FinanceRecord(
        category_id=category_id,
        entry_type=entry_type,
        amount=amount,
        date=date,
        notes=notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_finance_records(db: Session, category_id: int | None = None) -> list[FinanceRecord]:
    query = db.query(FinanceRecord)
    if category_id is not None:
        query = query.filter(FinanceRecord.category_id == category_id)
    return query.order_by(FinanceRecord.date.desc()).all()


def delete_finance_record(db: Session, record_id: int) -> bool:
    record = db.query(FinanceRecord).filter(FinanceRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_finance_summary(db: Session) -> dict:
    """
    Deliberately NOT scoped to a category — this powers the top
    summary cards and the Monthly Received/Paid/Profit chart, which
    stay showing the whole business regardless of which category is
    selected in the sidebar.
    """
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