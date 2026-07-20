import os
import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session
from services.email_config import get_email_config


def _check_smtp_configured(config: dict):
    if not all([config.get("SMTP_HOST"), config.get("SMTP_USER"), config.get("SMTP_PASSWORD")]):
        raise RuntimeError(
            "SMTP is not configured. Set it up on the Settings page, "
            "or via SMTP_HOST/SMTP_USER/SMTP_PASSWORD environment variables."
        )


def _send_via_smtp(config: dict, msg: EmailMessage) -> None:
    """
    Port 465 expects an SSL connection from the moment it's opened
    (smtplib.SMTP_SSL). Port 587 (and most others) expect a plain
    connection that gets upgraded to TLS via STARTTLS. Using the wrong
    one for a given port fails to connect at all, so pick based on
    the configured port rather than assuming STARTTLS always.
    """
    port = config["SMTP_PORT"]

    if port == 465:
        with smtplib.SMTP_SSL(config["SMTP_HOST"], port) as server:
            server.login(config["SMTP_USER"], config["SMTP_PASSWORD"])
            server.send_message(msg)
    else:
        with smtplib.SMTP(config["SMTP_HOST"], port) as server:
            server.starttls()
            server.login(config["SMTP_USER"], config["SMTP_PASSWORD"])
            server.send_message(msg)


def send_email_with_attachment(
    db: Session,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str,
) -> None:
    config = get_email_config(db)
    _check_smtp_configured(config)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{config['FROM_NAME']} <{config['FROM_EMAIL']}>"
    msg["To"] = to_email
    msg.set_content(body)

    with open(attachment_path, "rb") as f:
        file_data = f.read()
        file_name = os.path.basename(attachment_path)

    maintype = "application"
    subtype = "pdf" if file_name.lower().endswith(".pdf") else \
        "vnd.openxmlformats-officedocument.wordprocessingml.document"

    msg.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

    _send_via_smtp(config, msg)


def send_warning_email(db: Session, to_email: str, recipient_name: str, message: str) -> None:
    """
    Sends a plain compliance-warning email — no attachment.
    """
    config = get_email_config(db)
    _check_smtp_configured(config)

    msg = EmailMessage()
    msg["Subject"] = "Important: Communication Policy Reminder \u2014 ACA Technologies"
    msg["From"] = f"{config['FROM_NAME']} <{config['FROM_EMAIL']}>"
    msg["To"] = to_email

    body = f"Dear {recipient_name},\n\n{message}\n\nRegards,\nACA Technologies"
    msg.set_content(body)

    _send_via_smtp(config, msg)