import re
from dateutil import parser as date_parser

# ─────────────────────────────────────────
# Date extraction
# ─────────────────────────────────────────

DATE_LABELS = {
    "start_date": [
        r"Start\s*Date\s*[:\-]",
        r"From\s*Date\s*[:\-]",
        r"Commencement\s*Date\s*[:\-]",
        r"From\s*[:\-]",
    ],
    "end_date": [
        r"End\s*Date\s*[:\-]",
        r"To\s*Date\s*[:\-]",
        r"Completion\s*Date\s*[:\-]",
        r"To\s*[:\-]",
    ],
    "po_date": [
        r"(?<![A-Za-z])Date\s*[:\-]",
        r"PO\s*Date\s*[:\-]",
        r"Order\s*Date\s*[:\-]",
        r"Issue\s*Date\s*[:\-]",
    ],
}

DATE_PATTERN = r"""
    (?:
        \d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}
        |
        \d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}
        |
        \d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}
        |
        (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}
    )
"""


def _extract_date_near_label(text: str, label_patterns: list) -> str | None:
    for label_pattern in label_patterns:
        pattern = rf"{label_pattern}\s*({DATE_PATTERN.strip()})"
        match = re.search(pattern, text, re.IGNORECASE | re.VERBOSE)
        if match:
            raw_date = match.group(1).strip()
            try:
                parsed = date_parser.parse(raw_date, dayfirst=True)
                return parsed.strftime("%d/%m/%Y")
            except Exception:
                return raw_date
    return None


def extract_dates(text: str) -> dict:
    return {
        "start_date": _extract_date_near_label(text, DATE_LABELS["start_date"]),
        "end_date": _extract_date_near_label(text, DATE_LABELS["end_date"]),
        "po_date": _extract_date_near_label(text, DATE_LABELS["po_date"]),
    }


# ─────────────────────────────────────────
# PO Number extraction
# ─────────────────────────────────────────

PO_NUMBER_PATTERNS = [
    r"#\s*(PO[-\s][A-Za-z0-9\-]+)",
    r"PO\s*(?:No|Number|Num|#)\.?\s*[:\-]?\s*([A-Za-z0-9\-/]+)",
    r"Purchase\s+Order\s*(?:No|Number|#)\.?\s*[:\-]?\s*([A-Za-z0-9\-/]+)",
    r"Order\s*(?:No|Number|#)\.?\s*[:\-]?\s*([A-Za-z0-9\-/]+)",
]


def extract_po_number(text: str) -> str | None:
    for pattern in PO_NUMBER_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


# ─────────────────────────────────────────
# Qty extraction
# ─────────────────────────────────────────

def extract_qty(text: str) -> str | None:
    table_match = re.search(
        r"Item\s*&?\s*Description.*?(\d{1,3}(?:\.\d{2})?)\s+[\d,]+(?:\.\d{2})?\s+[\d,]+(?:\.\d{2})?",
        text, re.IGNORECASE | re.DOTALL
    )
    if table_match:
        return table_match.group(1).strip()

    match = re.search(
        r"Unit\s+of\s+Measure.*?(\d{1,3}(?:\.\d{2})?)\s",
        text, re.IGNORECASE | re.DOTALL
    )
    if match:
        return match.group(1).strip()

    return None


# ─────────────────────────────────────────
# Rate extraction
# ─────────────────────────────────────────

def extract_rate(text: str) -> str | None:
    table_section_match = re.search(
        r"Item\s*&?\s*Description(.*?)Total",
        text, re.IGNORECASE | re.DOTALL
    )
    if table_section_match:
        table_section = table_section_match.group(1)
        row_match = re.search(
            r"(\d{1,3}(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)",
            table_section
        )
        if row_match:
            return row_match.group(2).strip()

    match = re.search(
        r"Rate\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)",
        text, re.IGNORECASE
    )
    if match:
        return match.group(1).strip()

    return None


# ─────────────────────────────────────────
# Total extraction
# ─────────────────────────────────────────

def extract_total(text: str) -> str | None:
    patterns = [
        r"Total\s*(?:Amount)?\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)",
        r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)\s*$",
        r"Grand\s+Total\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    return None


# ─────────────────────────────────────────
# Location extraction
# ─────────────────────────────────────────

def extract_location(text: str) -> str | None:
    patterns = [
        r"Location\s+of\s+Training\s*[:\-]\s*([A-Za-z][A-Za-z\s]{1,30})",
        r"Training\s+Location\s*[:\-]\s*([A-Za-z][A-Za-z\s]{1,30})",
        r"Venue\s*[:\-]\s*([A-Za-z][A-Za-z\s]{1,30})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            location = match.group(1).strip()
            location = re.split(r"\n|\r|Scope|Unit|Batch", location)[0].strip()
            return location
    return None


# ─────────────────────────────────────────
# GSTIN extraction
# ─────────────────────────────────────────

def extract_gstin(text: str) -> str | None:
    match = re.search(
        r"GSTIN\s+([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})",
        text
    )
    if match:
        return match.group(1).strip()
    return None


# ─────────────────────────────────────────
# PAN extraction
# ─────────────────────────────────────────

def extract_pan(text: str) -> str | None:
    match = re.search(r"PAN\s+([A-Z]{5}[0-9]{4}[A-Z]{1})", text)
    if match:
        return match.group(1).strip()
    return None


# ─────────────────────────────────────────
# Vendor address extraction
# ─────────────────────────────────────────

def extract_vendor_address(text: str) -> str | None:
    patterns = [
        r"Vendor\s+Address\s*\n[^\n]+\n([^\n]+(?:\n[^\n]+)?)",
        r"Vendor\s+Address[^\n]*\n[^\n]+\n([A-Za-z0-9][^\n]+(?:\n[^\n]+)?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            address = match.group(1).strip()
            # Join hyphen-split lines (e.g. "Chennai-\n600082" → "Chennai-600082")
            address = re.sub(r'-\s*\n\s*', '', address)
            # Replace any remaining newlines with a space
            address = re.sub(r'\s*\n\s*', ' ', address)
            address = address.strip()
            if 5 <= len(address) <= 200:
                return address
    return None


# ─────────────────────────────────────────
# Master extraction function
# ─────────────────────────────────────────

def extract_fields_pattern(text: str) -> dict:
    dates = extract_dates(text)

    return {
        "start_date": dates["start_date"],
        "end_date": dates["end_date"],
        "po_date": dates["po_date"],
        "po_number": extract_po_number(text),
        "location": extract_location(text),
        "qty": extract_qty(text),
        "rate": extract_rate(text),
        "total": extract_total(text),
        "gstin": extract_gstin(text),
        "pan": extract_pan(text),
        "vendor_address": extract_vendor_address(text),
    }