"""
Shared email subject/body builders for documents sent to trainers.

This is the single source of truth for what these emails say. Every
send path (Trainers table, Editor/Creator's Send Email panel, and
manually-uploaded document sends) imports from here instead of
building its own subject/body inline — that duplication is exactly
what caused the PO email content to be updated in one place and not
the others. Don't inline subject/body text anywhere else; add a new
builder here instead.
"""


def build_po_email(trainer_name: str, reference_number: str | None = None) -> tuple[str, str]:
    subject = "Purchase Order, Onboarding, Aadhaar / PAN Submission and Confirmation"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""

    body = (
        f"Dear {trainer_name},\n\n"
        f"Greetings from ACA Technologies.\n\n"
        f"Please find attached the draft Purchase Order for your trainer engagement with ACA Technologies. "
        f"As part of the onboarding process, kindly complete your registration and profile formalities on "
        f"hiretrainers.in using your active email ID.\n\n"
        f"Kindly also include / submit your Aadhaar Card and PAN Card details or copies as required for "
        f"verification and payment processing.\n\n"
        f"{reference_line}"
        f"Please note the key terms mentioned in the PO:\n"
        f"- Payment will be made within 30 days after completion and approval of the training.\n"
        f"- TDS at 10% will be deducted from payable amounts as applicable.\n"
        f"- Travel or reimbursement claims, if approved, must be supported by valid bills or receipts.\n"
        f"- ACA Technologies reserves the right to cancel, withdraw, or discontinue the PO / trainer engagement "
        f"at any time at its sole discretion.\n"
        f"- Last-minute cancellation, discontinuation, misconduct, or direct dealing with ACA Technologies' "
        f"clients may lead to payment deductions, non-payment for incomplete work, or legal action as "
        f"appropriate.\n\n"
        f"Kindly complete the onboarding, submit the required Aadhaar Card and PAN Card details / copies, "
        f"and reply to this email confirming your acceptance of the attached PO terms.\n\n"
        f"Regards,\nACA Technologies"
    )
    return subject, body


def build_invoice_email(trainer_name: str, reference_number: str | None = None) -> tuple[str, str]:
    subject = "Invoice Template — Submission Required for Completed Training"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""

    body = (
        f"Dear {trainer_name},\n\n"
        f"Greetings from ACA Technologies.\n\n"
        f"Thank you for completing the assigned training program.\n\n"
        f"Please find attached the invoice template to be used for submitting your invoice for the completed "
        f"and approved training days / sessions. Kindly fill in all required details accurately and share the "
        f"completed invoice along with the necessary supporting documents.\n\n"
        f"{reference_line}"
        f"Please ensure the invoice includes:\n"
        f"- Trainer name and contact details\n"
        f"- PO number / assignment reference\n"
        f"- Training subject, batch, client / institution name, and training dates\n"
        f"- Number of completed and approved training days / sessions\n"
        f"- Agreed rate and total invoice amount\n"
        f"- Bank account details for payment processing\n"
        f"- PAN / GST details, if applicable\n"
        f"- Reimbursement claims, if any, with valid bills or receipts\n\n"
        f"Please note that payment will be processed only after invoice verification and internal approval. "
        f"TDS and applicable tax deductions will be made as per the agreed terms and applicable law.\n\n"
        f"Kindly submit the completed invoice template at the earliest for payment processing.\n\n"
        f"Regards,\nACA Technologies"
    )
    return subject, body


def strip_markdown_bold(text: str) -> str:
    """
    Certificate contribution summaries may contain **bold** markdown
    (per Creator's own hint text for that field). Email bodies here are
    plain text, so drop the ** markers rather than showing them literally.
    """
    import re
    return re.sub(r"\*\*(.+?)\*\*", r"\1", text)


def build_offer_letter_email(
    intern_name: str, role: str, department: str, start_date: str,
    duration: str, work_mode: str, acceptance_deadline: str,
) -> tuple[str, str]:
    subject = "Congratulations! Internship Offer from ACA Technologies"

    body = (
        f"Dear {intern_name},\n\n"
        f"Congratulations!\n\n"
        f"We are pleased to inform you that you have been selected for the position of {role} "
        f"at ACA Technologies.\n\n"
        f"Please find the offer details below:\n\n"
        f"Position: {role}\n"
        f"Department/Domain: {department}\n"
        f"Start Date: {start_date}\n"
        f"Duration: {duration}\n"
        f"Work Mode: {work_mode}\n\n"
        f"Please find the offer letter attached for your reference. Kindly review the details and "
        f"confirm your acceptance by replying to this email by {acceptance_deadline}.\n\n"
        f"We are excited to welcome you to ACA Technologies and look forward to your successful "
        f"internship journey with us.\n\n"
        f"Best regards,\nACA Technologies"
    )
    return subject, body


def build_internship_completion_email(intern_name: str, contribution_summary: str | None = None) -> tuple[str, str]:
    subject = f"Completion of Internship Certificate - {intern_name}"

    if contribution_summary:
        clean_summary = strip_markdown_bold(contribution_summary)
        contribution_line = (
            f"We sincerely appreciate your contributions during the internship, especially your work on "
            f"{clean_summary}.\n\n"
        )
    else:
        contribution_line = "We sincerely appreciate your contributions during the internship.\n\n"

    body = (
        f"Dear {intern_name},\n\n"
        f"Congratulations on successfully completing your internship with ACA Technologies.\n\n"
        f"{contribution_line}"
        f"Your work ethic, technical proficiency, and professional conduct throughout the internship "
        f"have been commendable. We wish you continued success in your academic and professional journey.\n\n"
        f"Please find your internship completion certificate attached.\n\n"
        f"Best regards,\nACA Technologies\n"
        f"Email: support@hiretrainers.in\n"
        f"Website: www.hiretrainers.in"
    )
    return subject, body


def build_default_email(trainer_name: str, doc_label: str, reference_number: str | None = None) -> tuple[str, str]:
    subject = f"{doc_label} from ACA Technologies \u2014 {trainer_name}"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""

    body = (
        f"Dear {trainer_name},\n\n"
        f"Please find attached your {doc_label.lower()} from ACA Technologies.\n\n"
        f"{reference_line}"
        f"Regards,\nACA Technologies"
    )
    return subject, body


def build_email_for_document_type(document_type: str, trainer_name: str, reference_number: str | None = None) -> tuple[str, str]:
    """Convenience wrapper: picks the right builder based on document_type."""
    if document_type == "po":
        return build_po_email(trainer_name, reference_number)
    if document_type == "invoice":
        return build_invoice_email(trainer_name, reference_number)
    doc_label = document_type.replace("_", " ").title()
    return build_default_email(trainer_name, doc_label, reference_number)