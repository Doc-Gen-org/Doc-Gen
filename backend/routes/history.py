import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import DocumentRecord, Company

router = APIRouter()

GENERATED_FILES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "generated_files"
)


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(DocumentRecord).order_by(
        DocumentRecord.created_at.desc()
    ).all()

    return {
        "records": [
            {
                "id": r.id,
                "document_type": r.document_type,
                "company_id": r.company_id,
                "output_format": r.output_format,
                "filename": r.filename,
                "source_document_id": r.source_document_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    }


@router.get("/history/{record_id}/download")
def download_history_file(record_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(
        DocumentRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail={"error": "Record not found"})

    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail={"error": "File no longer exists on disk — may have been cleared"}
        )

    media_type = "application/pdf" if record.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=record.filename,
    )


@router.get("/history/{record_id}/fields")
def get_history_fields(record_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(
        DocumentRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail={"error": "Record not found"})

    try:
        fields = json.loads(record.fields_json)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={"error": "Could not parse stored field data"}
        )

    return {
        "id": record.id,
        "document_type": record.document_type,
        "company_id": record.company_id,
        "fields": fields,
    }


@router.delete("/history/{record_id}")
def delete_history_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(
        DocumentRecord.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail={"error": "Record not found"})

    # Delete the actual file from disk if it exists
    file_path = os.path.join(GENERATED_FILES_DIR, record.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(record)
    db.commit()

    return {"message": f"Record {record_id} deleted successfully"}