from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import EmailSettings, CompanyAccount
from services.email_config import get_email_config, save_email_config
from services.email_sender import send_email_with_attachment
import os
import tempfile

router = APIRouter()


class EmailSettingsRequest(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str  # empty string means "keep the existing password"
    from_name: str


class TestEmailRequest(BaseModel):
    to_email: str


@router.get("/settings/email")
def get_settings(db: Session = Depends(get_db)):
    config = get_email_config(db)
    return {
        "smtp_host": config["SMTP_HOST"],
        "smtp_port": config["SMTP_PORT"],
        "smtp_user": config["SMTP_USER"],
        "from_name": config["FROM_NAME"],
        "configured": bool(config["SMTP_HOST"] and config["SMTP_USER"] and config["SMTP_PASSWORD"]),
    }


@router.post("/settings/email")
def update_settings(request: EmailSettingsRequest, db: Session = Depends(get_db)):
    password_to_save = request.smtp_password

    if not password_to_save:
        # Blank means "don't change it" — keep whatever's already saved
        existing = db.query(EmailSettings).first()
        password_to_save = existing.smtp_password if existing else ""

        if not password_to_save:
            raise HTTPException(
                status_code=422,
                detail={"error": "Password is required the first time you configure email settings."},
            )

    save_email_config(
        db,
        host=request.smtp_host,
        port=request.smtp_port,
        user=request.smtp_user,
        password=password_to_save,
        from_name=request.from_name,
    )
    return {"status": "saved"}


@router.post("/settings/email/test")
def send_test_email(request: TestEmailRequest, db: Session = Depends(get_db)):
    tmp_path = os.path.join(tempfile.gettempdir(), "docgen_test_email.pdf")
    with open(tmp_path, "wb") as f:
        f.write(b"%PDF-1.4\n%Test file for DocGen SMTP test email.\n")

    try:
        send_email_with_attachment(
            db=db,
            to_email=request.to_email,
            subject="DocGen \u2014 Test Email",
            body="This is a test email from DocGen to confirm your SMTP settings are working correctly.",
            attachment_path=tmp_path,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Test email failed: {str(e)}"})
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {"status": "sent", "to": request.to_email}


class CompanyAccountRequest(BaseModel):
    label: str
    account_holder_name: str
    bank_name: str
    account_number: str
    ifsc_code: str
    pan_number: str
    mode_of_payment: str


def _account_dict(rec: CompanyAccount) -> dict:
    return {
        "id": rec.id,
        "label": rec.label,
        "account_holder_name": rec.account_holder_name,
        "bank_name": rec.bank_name or "",
        "account_number": rec.account_number,
        "ifsc_code": rec.ifsc_code or "",
        "pan_number": rec.pan_number or "",
        "mode_of_payment": rec.mode_of_payment or "",
    }


@router.get("/settings/company-accounts")
def list_company_accounts(db: Session = Depends(get_db)):
    accounts = db.query(CompanyAccount).order_by(CompanyAccount.id).all()
    return {"accounts": [_account_dict(a) for a in accounts]}


@router.post("/settings/company-accounts")
def create_company_account(request: CompanyAccountRequest, db: Session = Depends(get_db)):
    rec = CompanyAccount(
        label=request.label.strip(),
        account_holder_name=request.account_holder_name.strip(),
        bank_name=request.bank_name.strip(),
        account_number=request.account_number.strip(),
        ifsc_code=request.ifsc_code.strip(),
        pan_number=request.pan_number.strip(),
        mode_of_payment=request.mode_of_payment.strip(),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _account_dict(rec)


@router.put("/settings/company-accounts/{account_id}")
def update_company_account(account_id: int, request: CompanyAccountRequest, db: Session = Depends(get_db)):
    rec = db.query(CompanyAccount).filter(CompanyAccount.id == account_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail={"error": "Account not found"})
    rec.label = request.label.strip()
    rec.account_holder_name = request.account_holder_name.strip()
    rec.bank_name = request.bank_name.strip()
    rec.account_number = request.account_number.strip()
    rec.ifsc_code = request.ifsc_code.strip()
    rec.pan_number = request.pan_number.strip()
    rec.mode_of_payment = request.mode_of_payment.strip()
    db.commit()
    return _account_dict(rec)


@router.delete("/settings/company-accounts/{account_id}")
def delete_company_account(account_id: int, db: Session = Depends(get_db)):
    rec = db.query(CompanyAccount).filter(CompanyAccount.id == account_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail={"error": "Account not found"})
    db.delete(rec)
    db.commit()
    return {"status": "deleted"}