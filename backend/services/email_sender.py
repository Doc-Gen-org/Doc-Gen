import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USER)
FROM_NAME = os.environ.get("FROM_NAME", "ACA Technologies")


def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str,
) -> None:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        raise RuntimeError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD "
            "as environment variables before sending email."
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email
    msg.set_content(body)

    with open(attachment_path, "rb") as f:
        file_data = f.read()
        file_name = os.path.basename(attachment_path)

    maintype = "application"
    subtype = "pdf" if file_name.lower().endswith(".pdf") else \
        "vnd.openxmlformats-officedocument.wordprocessingml.document"

    msg.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)