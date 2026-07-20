import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import DocumentRecord, Trainer
from services.email_sender import send_email_with_attachment
from services.email_templates import build_email_for_document_type
from services.app_paths import GENERATED_FILES_DIR as OUTPUT_DIR

router = APIRouter()


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

    greeting_name = trainer_name or "Trainer"
    default_subject, default_body = build_email_for_document_type(document.document_type, greeting_name)

    subject = request.subject or default_subject
    body = request.message or default_body

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