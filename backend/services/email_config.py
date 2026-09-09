import os
from sqlalchemy.orm import Session
from models.schemas import EmailSettings


def get_email_config(db: Session) -> dict:
    """
    Returns the active SMTP config. Prefers the database row if one
    exists and is filled in; falls back to .env values otherwise —
    so nothing breaks for setups still using the old .env approach.
    """
    settings = db.query(EmailSettings).first()

    if settings and settings.smtp_host and settings.smtp_user and settings.smtp_password:
        return {
            "SMTP_HOST": settings.smtp_host,
            "SMTP_PORT": settings.smtp_port or 587,
            "SMTP_USER": settings.smtp_user,
            "SMTP_PASSWORD": settings.smtp_password,
            "FROM_EMAIL": settings.smtp_user,
            "FROM_NAME": settings.from_name or "ACA Technologies",
        }

    return {
        "SMTP_HOST": os.environ.get("SMTP_HOST"),
        "SMTP_PORT": int(os.environ.get("SMTP_PORT", "587")),
        "SMTP_USER": os.environ.get("SMTP_USER"),
        "SMTP_PASSWORD": os.environ.get("SMTP_PASSWORD"),
        "FROM_EMAIL": os.environ.get("FROM_EMAIL", os.environ.get("SMTP_USER")),
        "FROM_NAME": os.environ.get("FROM_NAME", "ACA Technologies"),
    }


def save_email_config(db: Session, host: str, port: int, user: str, password: str, from_name: str) -> None:
    settings = db.query(EmailSettings).first()
    if not settings:
        settings = EmailSettings()
        db.add(settings)

    settings.smtp_host = host
    settings.smtp_port = port
    settings.smtp_user = user
    settings.smtp_password = password
    settings.from_name = from_name

    db.commit()