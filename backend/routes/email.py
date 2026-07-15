import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import DocumentRecord, Trainer
from services.email_sender import send_email_with_attachment

router = APIRouter()

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_files")


class SendEmailRequest(BaseModel):
    document_id: int
    trainer_id: Optional[int] = None
    trainer_email: Optional[str] = None   # manual override, wins if provided
    subject: Optional[str] = None
    message: Optional[str] = None


@router.post("/send-email")
def send_email(request: SendEmailRequest, db: Session = Depends(get_db)):
    document = db.query(DocumentRecord).filter(DocumentRecord.id == request.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail={"error": "Document not found"})

    recipient_email = request.trainer_email
    trainer_name = None

    if not recipient_email:
        if not request.trainer_id:
            raise HTTPException(
                status_code=422,
                detail={"error": "Provide either trainer_id or trainer_email"},
            )
        trainer = db.query(Trainer).filter(Trainer.id == request.trainer_id).first()
        if not trainer:
            raise HTTPException(status_code=404, detail={"error": "Trainer not found"})
        recipient_email = trainer.email
        trainer_name = trainer.name

    file_path = os.path.join(OUTPUT_DIR, document.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=422, detail={"error": "Generated file no longer exists on disk"})

    subject = request.subject or f"Purchase Order from ACA Technologies"
    greeting_name = trainer_name or "Trainer"
    body = request.message or (
        f"Dear {greeting_name},\n\n"
        f"Please find attached your Purchase Order from ACA Technologies.\n\n"
        f"Regards,\nACA Technologies"
    )

    try:
        send_email_with_attachment(
            db=db,
            to_email=recipient_email,
            subject=subject,
            body=body,
            attachment_path=file_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Email sending failed: {str(e)}"})

    return {"status": "sent", "to": recipient_email, "document_id": document.id}