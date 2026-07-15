from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import WarningEmailLog
from services.email_sender import send_warning_email

router = APIRouter()

DEFAULT_WARNING_MESSAGE = (
    "This is to bring to your attention that direct communication with a trainer, "
    "bypassing ACA Technologies as the engaged vendor, has been identified.\n\n"
    "Please be advised that all communication regarding training engagements, "
    "scheduling, and payments must be routed through ACA Technologies as per the "
    "terms of the agreement in place. Direct contact with trainers outside of this "
    "process is not permitted and may result in a review of the current engagement.\n\n"
    "We request that this be strictly adhered to going forward."
)


class WarningRecipient(BaseModel):
    recipient_name: str
    recipient_email: str


class WarningEmailRequest(BaseModel):
    recipients: list[WarningRecipient]
    message: str | None = None


@router.get("/warnings/default-message")
def get_default_message():
    return {"message": DEFAULT_WARNING_MESSAGE}


@router.get("/warnings")
def list_warnings(db: Session = Depends(get_db)):
    logs = db.query(WarningEmailLog).order_by(WarningEmailLog.sent_at.desc()).all()
    return {
        "warnings": [
            {
                "id": w.id,
                "recipient_name": w.recipient_name,
                "recipient_email": w.recipient_email,
                "message": w.message,
                "sent_at": w.sent_at.isoformat() if w.sent_at else None,
            }
            for w in logs
        ]
    }


@router.post("/warnings/send")
def send_warning(request: WarningEmailRequest, db: Session = Depends(get_db)):
    if not request.recipients:
        raise HTTPException(status_code=422, detail={"error": "At least one recipient is required."})

    message = request.message or DEFAULT_WARNING_MESSAGE
    results = []

    for recipient in request.recipients:
        try:
            send_warning_email(
                db=db,
                to_email=recipient.recipient_email,
                recipient_name=recipient.recipient_name,
                message=message,
            )
            log = WarningEmailLog(
                recipient_name=recipient.recipient_name,
                recipient_email=recipient.recipient_email,
                message=message,
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            results.append({
                "recipient_name": recipient.recipient_name,
                "recipient_email": recipient.recipient_email,
                "status": "sent",
                "id": log.id,
            })
        except Exception as e:
            results.append({
                "recipient_name": recipient.recipient_name,
                "recipient_email": recipient.recipient_email,
                "status": "failed",
                "error": str(e),
            })

    sent_count = sum(1 for r in results if r["status"] == "sent")
    failed_count = len(results) - sent_count

    return {"sent_count": sent_count, "failed_count": failed_count, "results": results}