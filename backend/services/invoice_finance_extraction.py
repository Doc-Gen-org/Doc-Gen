import os
from docx import Document

FINANCE_KEYWORDS = [
    "account", "bank", "ifsc", "pan", "amount", "payment",
    "invoice number", "invoice date", "rate", "training days",
]


def _is_finance_relevant(label: str) -> bool:
    label_lower = label.strip().lower()
    if not label_lower:
        return False
    return any(keyword in label_lower for keyword in FINANCE_KEYWORDS)


def extract_finance_details_from_docx(file_path: str) -> dict:
    """
    Scans every 2-column table row in a filled invoice DOCX and returns
    label: value pairs for anything finance-relevant. Generic by design —
    doesn't assume fixed field names, since the invoice template's exact
    labels have changed before and may change again.
    """
    doc = Document(file_path)
    results = {}

    for table in doc.tables:
        for row in table.rows:
            if len(row.cells) != 2:
                continue

            label = row.cells[0].text.strip()
            value = row.cells[1].text.strip()

            if not value:
                continue  # trainer left this field blank

            if _is_finance_relevant(label):
                results[label] = value

    return results


def extract_finance_details_from_pdf(file_path: str) -> dict:
    """
    Best-effort extraction for a filled PDF invoice — PDFs don't have
    reliable table structure like DOCX, so this falls back to scanning
    text lines for a "Label: Value" pattern. Less reliable than the
    DOCX path; may miss fields depending on how the PDF was filled.
    """
    try:
        import pdfplumber
    except ImportError:
        return {}

    results = {}
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                for line in text.split("\n"):
                    if ":" not in line:
                        continue
                    label, _, value = line.partition(":")
                    label = label.strip()
                    value = value.strip()
                    if value and _is_finance_relevant(label):
                        results[label] = value
    except Exception:
        return {}

    return results


def extract_finance_details(file_path: str) -> dict:
    extension = os.path.splitext(file_path)[1].lower()
    if extension == ".docx":
        return extract_finance_details_from_docx(file_path)
    elif extension == ".pdf":
        return extract_finance_details_from_pdf(file_path)
    return {}