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


class FinanceRecordCreate(BaseModel):
    company_name: str
    amount_received: float
    receiving_date: str
    trainer_name: str
    amount_sent: float
    sending_date: str
    notes: str | None = None


def _serialize_record(r):
    return {
        "id": r.id,
        "company_name": r.company_name,
        "amount_received": r.amount_received,
        "receiving_date": r.receiving_date,
        "trainer_name": r.trainer_name,
        "amount_sent": r.amount_sent,
        "sending_date": r.sending_date,
        "profit": r.amount_received - r.amount_sent,
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/finance/records")
def get_records(db: Session = Depends(get_db)):
    records = list_finance_records(db)
    return {"records": [_serialize_record(r) for r in records]}


@router.post("/finance/records")
def add_record(request: FinanceRecordCreate, db: Session = Depends(get_db)):
    record = create_finance_record(
        db,
        company_name=request.company_name,
        amount_received=request.amount_received,
        receiving_date=request.receiving_date,
        trainer_name=request.trainer_name,
        amount_sent=request.amount_sent,
        sending_date=request.sending_date,
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
    writer.writerow([
        "Company", "Amount Received", "Receiving Date",
        "Trainer", "Amount Sent", "Sending Date", "Profit", "Notes",
    ])

    for r in records:
        writer.writerow([
            r.company_name, r.amount_received, r.receiving_date,
            r.trainer_name, r.amount_sent, r.sending_date,
            r.amount_received - r.amount_sent, r.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finance_records.csv"},
    )