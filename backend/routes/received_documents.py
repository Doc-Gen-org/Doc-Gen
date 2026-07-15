import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import Trainer, ReceivedDocument
from services.received_documents import save_received_document, get_received_documents, get_trainer_status, RECEIVED_DIR

router = APIRouter()


@router.get("/trainers/{trainer_id}/received")
def list_received_documents(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    docs = get_received_documents(db, trainer_id, doc_type="invoice")
    return {
        "documents": [
            {
                "id": d.id,
                "doc_type": d.doc_type,
                "original_filename": d.original_filename,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ]
    }


@router.get("/trainers/{trainer_id}/status")
def trainer_status(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    return get_trainer_status(db, trainer)


@router.post("/trainers/{trainer_id}/received")
async def upload_received_document(
    trainer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a filled-in invoice received back from the trainer.
    PO is never manually uploaded here — it's tracked automatically
    from whatever's been generated for this trainer.
    """
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail={"error": "Trainer not found"})

    allowed_extensions = {"pdf", "docx"}
    extension = file.filename.lower().split(".")[-1]
    if extension not in allowed_extensions:
        raise HTTPException(status_code=422, detail={"error": "Only PDF or DOCX files are allowed"})

    contents = await file.read()
    record = save_received_document(db, trainer_id, "invoice", file.filename, contents)

    return {
        "id": record.id,
        "doc_type": record.doc_type,
        "original_filename": record.original_filename,
        "uploaded_at": record.uploaded_at.isoformat() if record.uploaded_at else None,
    }


@router.get("/trainers/{trainer_id}/received/{document_id}/download")
def download_received_document(trainer_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(ReceivedDocument).filter(
        ReceivedDocument.id == document_id, ReceivedDocument.trainer_id == trainer_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(RECEIVED_DIR, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "File no longer exists on disk"})

    media_type = "application/pdf" if record.filename.lower().endswith(".pdf") else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(path=file_path, media_type=media_type, filename=record.original_filename)


@router.delete("/trainers/{trainer_id}/received/{document_id}")
def delete_received_document(trainer_id: int, document_id: int, db: Session = Depends(get_db)):
    record = db.query(ReceivedDocument).filter(
        ReceivedDocument.id == document_id, ReceivedDocument.trainer_id == trainer_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    file_path = os.path.join(RECEIVED_DIR, record.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(record)
    db.commit()

    return {"message": "Deleted successfully"}