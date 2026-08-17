"""
Shared email subject/body builders for documents sent to trainers.

This is the single source of truth for what these emails say. Every
send path (Trainers table, Editor/Creator's Send Email panel, and
manually-uploaded document sends) imports from here instead of
building its own subject/body inline — that duplication is exactly
what caused the PO email content to be updated in one place and not
the others. Don't inline subject/body text anywhere else; add a new
builder here instead.

Each builder returns (subject, plain_body, html_body):
- plain_body is the original, unstyled fallback — sent as the
  plain-text part of the email so it still reads cleanly in clients
  that don't render HTML.
- html_body is the same content with key details (Aadhaar/PAN,
  reference numbers, ACA Technologies, offer terms, etc.) in bold,
  sent as the HTML alternative so most modern email clients show the
  highlighted version by default.

Dynamic values (names, reference numbers, dates) are HTML-escaped
before being embedded in html_body, since they come from user-entered
data — never string-interpolate them into HTML unescaped.
"""

import html as _html


def _esc(value: str | None) -> str:
    return _html.escape(value) if value else ""


def _p(*lines: str) -> str:
    """Wraps one or more <br>-joined lines in a paragraph."""
    return f"<p>{'<br>'.join(lines)}</p>"


_HTML_WRAPPER_OPEN = '<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 1.5;">'
_HTML_WRAPPER_CLOSE = "</div>"


def build_po_email(trainer_name: str, reference_number: str | None = None, payment_days: int | str | None = None) -> tuple[str, str, str]:
    subject = "Purchase Order, Onboarding, Aadhaar / PAN Submission and Confirmation"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""
    payment_days_line = (
        f"- Payment will be made within {payment_days} days after completion and approval of the training.\n"
        if payment_days else ""
    )

    plain_body = (
        f"Dear {trainer_name},\n\n"
        f"Greetings from ACA Technologies.\n\n"
        f"Please find attached the draft Purchase Order for your trainer engagement with ACA Technologies. "
        f"As part of the onboarding process, kindly complete your registration and profile formalities on "
        f"hiretrainers.in using your active email ID.\n\n"
        f"Kindly also include / submit your Aadhaar Card and PAN Card details or copies as required for "
        f"verification and payment processing.\n\n"
        f"{reference_line}"
        f"Please note the key terms mentioned in the PO:\n"
        f"{payment_days_line}"
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

    name = _esc(trainer_name)
    ref_html = f"<p>Reference Number: <strong>{_esc(reference_number)}</strong></p>" if reference_number else ""
    payment_days_html = (
        f"<li>Payment will be made <strong>within {_esc(str(payment_days))} days</strong> after completion and approval of the training.</li>"
        if payment_days else ""
    )

    html_body = (
        _HTML_WRAPPER_OPEN
        + _p(f"Dear {name},")
        + _p(f"Greetings from <strong>ACA Technologies</strong>.")
        + _p(
            "Please find attached the draft Purchase Order for your trainer engagement with "
            "<strong>ACA Technologies</strong>. As part of the onboarding process, kindly complete your "
            "registration and profile formalities on hiretrainers.in using your active email ID."
        )
        + _p(
            "Kindly also include / submit your <strong>Aadhaar Card</strong> and <strong>PAN Card</strong> "
            "details or copies as required for verification and payment processing."
        )
        + ref_html
        + _p("Please note the key terms mentioned in the PO:")
        + "<ul>"
        + payment_days_html
        + "<li><strong>TDS at 10%</strong> will be deducted from payable amounts as applicable.</li>"
        + "<li>Travel or reimbursement claims, if approved, must be supported by valid bills or receipts.</li>"
        + "<li><strong>ACA Technologies</strong> reserves the right to cancel, withdraw, or discontinue the PO / trainer engagement at any time at its sole discretion.</li>"
        + "<li>Last-minute cancellation, discontinuation, misconduct, or direct dealing with ACA Technologies' clients may lead to payment deductions, non-payment for incomplete work, or legal action as appropriate.</li>"
        + "</ul>"
        + _p(
            "Kindly complete the onboarding, submit the required <strong>Aadhaar Card</strong> and "
            "<strong>PAN Card</strong> details / copies, and reply to this email confirming your acceptance "
            "of the attached PO terms."
        )
        + _p("Regards,<br><strong>ACA Technologies</strong>")
        + _HTML_WRAPPER_CLOSE
    )

    return subject, plain_body, html_body


def build_invoice_email(trainer_name: str, reference_number: str | None = None) -> tuple[str, str, str]:
    subject = "Invoice Template — Submission Required for Completed Training"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""

    plain_body = (
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

    name = _esc(trainer_name)
    ref_html = f"<p>Reference Number: <strong>{_esc(reference_number)}</strong></p>" if reference_number else ""

    html_body = (
        _HTML_WRAPPER_OPEN
        + _p(f"Dear {name},")
        + _p("Greetings from <strong>ACA Technologies</strong>.")
        + _p("Thank you for completing the assigned training program.")
        + _p(
            "Please find attached the invoice template to be used for submitting your invoice for the "
            "completed and approved training days / sessions. Kindly fill in all required details accurately "
            "and share the completed invoice along with the necessary supporting documents."
        )
        + ref_html
        + _p("Please ensure the invoice includes:")
        + "<ul>"
        + "<li>Trainer name and contact details</li>"
        + "<li>PO number / assignment reference</li>"
        + "<li>Training subject, batch, client / institution name, and training dates</li>"
        + "<li>Number of completed and approved training days / sessions</li>"
        + "<li>Agreed rate and total invoice amount</li>"
        + "<li>Bank account details for payment processing</li>"
        + "<li><strong>PAN / GST details</strong>, if applicable</li>"
        + "<li>Reimbursement claims, if any, with valid bills or receipts</li>"
        + "</ul>"
        + _p(
            "Please note that payment will be processed only after invoice verification and internal "
            "approval. <strong>TDS</strong> and applicable tax deductions will be made as per the agreed "
            "terms and applicable law."
        )
        + _p("Kindly submit the completed invoice template at the earliest for payment processing.")
        + _p("Regards,<br><strong>ACA Technologies</strong>")
        + _HTML_WRAPPER_CLOSE
    )

    return subject, plain_body, html_body


def strip_markdown_bold(text: str) -> str:
    """
    Certificate contribution summaries may contain **bold** markdown
    (per Creator's own hint text for that field). Used for the plain
    text version of the completion email — the HTML version converts
    ** markers to real <strong> tags instead of stripping them.
    """
    import re
    return re.sub(r"\*\*(.+?)\*\*", r"\1", text)


def _markdown_bold_to_html(text: str) -> str:
    """Converts **bold** markdown to real <strong> tags, escaping everything else."""
    import re
    parts = re.split(r"(\*\*.+?\*\*)", text)
    out = []
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            out.append(f"<strong>{_esc(part[2:-2])}</strong>")
        else:
            out.append(_esc(part))
    return "".join(out)


def build_offer_letter_email(
    intern_name: str, role: str, department: str, start_date: str,
    duration: str, work_mode: str, acceptance_deadline: str,
) -> tuple[str, str, str]:
    subject = "Congratulations! Internship Offer from ACA Technologies"

    plain_body = (
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

    name = _esc(intern_name)
    role_e, dept_e, start_e, dur_e, mode_e, deadline_e = (
        _esc(role), _esc(department), _esc(start_date), _esc(duration), _esc(work_mode), _esc(acceptance_deadline)
    )

    html_body = (
        _HTML_WRAPPER_OPEN
        + _p(f"Dear {name},")
        + _p("Congratulations!")
        + _p(
            f"We are pleased to inform you that you have been selected for the position of "
            f"<strong>{role_e}</strong> at <strong>ACA Technologies</strong>."
        )
        + _p("Please find the offer details below:")
        + "<ul>"
        + f"<li>Position: <strong>{role_e}</strong></li>"
        + f"<li>Department/Domain: <strong>{dept_e}</strong></li>"
        + f"<li>Start Date: <strong>{start_e}</strong></li>"
        + f"<li>Duration: <strong>{dur_e}</strong></li>"
        + f"<li>Work Mode: <strong>{mode_e}</strong></li>"
        + "</ul>"
        + _p(
            "Please find the offer letter attached for your reference. Kindly review the details and "
            f"confirm your acceptance by replying to this email by <strong>{deadline_e}</strong>."
        )
        + _p(
            "We are excited to welcome you to <strong>ACA Technologies</strong> and look forward to your "
            "successful internship journey with us."
        )
        + _p("Best regards,<br><strong>ACA Technologies</strong>")
        + _HTML_WRAPPER_CLOSE
    )

    return subject, plain_body, html_body


def build_internship_completion_email(intern_name: str, contribution_summary: str | None = None) -> tuple[str, str, str]:
    subject = f"Completion of Internship Certificate - {intern_name}"

    if contribution_summary:
        clean_summary = strip_markdown_bold(contribution_summary)
        contribution_line = (
            f"We sincerely appreciate your contributions during the internship, especially your work on "
            f"{clean_summary}.\n\n"
        )
    else:
        contribution_line = "We sincerely appreciate your contributions during the internship.\n\n"

    plain_body = (
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

    name = _esc(intern_name)
    if contribution_summary:
        summary_html = _markdown_bold_to_html(contribution_summary)
        contribution_html = (
            f"We sincerely appreciate your contributions during the internship, especially your work on "
            f"{summary_html}."
        )
    else:
        contribution_html = "We sincerely appreciate your contributions during the internship."

    html_body = (
        _HTML_WRAPPER_OPEN
        + _p(f"Dear {name},")
        + _p("Congratulations on successfully completing your internship with <strong>ACA Technologies</strong>.")
        + _p(contribution_html)
        + _p(
            "Your work ethic, technical proficiency, and professional conduct throughout the internship "
            "have been commendable. We wish you continued success in your academic and professional journey."
        )
        + _p("Please find your internship completion certificate attached.")
        + _p(
            "Best regards,<br><strong>ACA Technologies</strong><br>"
            "Email: support@hiretrainers.in<br>"
            "Website: www.hiretrainers.in"
        )
        + _HTML_WRAPPER_CLOSE
    )

    return subject, plain_body, html_body


def build_default_email(trainer_name: str, doc_label: str, reference_number: str | None = None) -> tuple[str, str, str]:
    subject = f"{doc_label} from ACA Technologies \u2014 {trainer_name}"

    reference_line = f"Reference Number: {reference_number}\n\n" if reference_number else ""

    plain_body = (
        f"Dear {trainer_name},\n\n"
        f"Please find attached your {doc_label.lower()} from ACA Technologies.\n\n"
        f"{reference_line}"
        f"Regards,\nACA Technologies"
    )

    name = _esc(trainer_name)
    label_e = _esc(doc_label.lower())
    ref_html = f"<p>Reference Number: <strong>{_esc(reference_number)}</strong></p>" if reference_number else ""

    html_body = (
        _HTML_WRAPPER_OPEN
        + _p(f"Dear {name},")
        + _p(f"Please find attached your {label_e} from <strong>ACA Technologies</strong>.")
        + ref_html
        + _p("Regards,<br><strong>ACA Technologies</strong>")
        + _HTML_WRAPPER_CLOSE
    )

    return subject, plain_body, html_body


def build_email_for_document_type(document_type: str, trainer_name: str, reference_number: str | None = None, payment_days: int | str | None = None) -> tuple[str, str, str]:
    """Convenience wrapper: picks the right builder based on document_type."""
    if document_type == "po":
        return build_po_email(trainer_name, reference_number, payment_days)
    if document_type == "invoice":
        return build_invoice_email(trainer_name, reference_number)
    doc_label = document_type.replace("_", " ").title()
    return build_default_email(trainer_name, doc_label, reference_number)