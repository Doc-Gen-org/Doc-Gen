import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from services.finance_service import (
    create_finance_record,
    list_finance_records,
    delete_finance_record,
    get_finance_summary,
)

router = APIRouter()

VALID_ENTRY_TYPES = {"received", "paid"}


class FinanceRecordCreate(BaseModel):
    entry_type: str
    amount: float
    date: str
    notes: str | None = None


def _serialize_record(r):
    return {
        "id": r.id,
        "entry_type": r.entry_type,
        "amount": r.amount,
        "date": r.date,
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/finance/records")
def get_records(db: Session = Depends(get_db)):
    records = list_finance_records(db)
    return {"records": [_serialize_record(r) for r in records]}


@router.post("/finance/records")
def add_record(request: FinanceRecordCreate, db: Session = Depends(get_db)):
    if request.entry_type not in VALID_ENTRY_TYPES:
        raise HTTPException(
            status_code=422,
            detail={"error": f"entry_type must be one of {sorted(VALID_ENTRY_TYPES)}"},
        )
    record = create_finance_record(
        db,
        entry_type=request.entry_type,
        amount=request.amount,
        date=request.date,
        notes=request.notes,
    )
    return _serialize_record(record)


@router.delete("/finance/records/{record_id}")
def remove_record(record_id: int, db: Session = Depends(get_db)):
    deleted = delete_finance_record(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": "Record not found"})
    return {"message": "Deleted successfully"}


@router.get("/finance/summary")
def get_summary(db: Session = Depends(get_db)):
    return get_finance_summary(db)


@router.get("/finance/export")
def export_csv(db: Session = Depends(get_db)):
    records = list_finance_records(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Type", "Amount", "Date", "Notes"])

    for r in records:
        # Wrapping the date as an Excel text-formula (="...") stops Excel
        # from auto-converting it into a date serial number when the CSV
        # is opened — that auto-conversion is what causes the "#######"
        # overflow display when the column is too narrow.
        excel_safe_date = f'="{r.date}"'
        writer.writerow([r.entry_type, r.amount, excel_safe_date, r.notes or ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finance_records.csv"},
    )