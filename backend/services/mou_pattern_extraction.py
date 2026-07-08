import re
from dateutil import parser as date_parser


# ─────────────────────────────────────────
# MOU Date extraction
# ─────────────────────────────────────────

def extract_mou_date(text: str) -> str | None:
    patterns = [
        r"executed\s+on\s+(\d{1,2}[-/]\w+[-/]\d{2,4})",
        r"executed\s+on\s+(\d{1,2}\s+\w+\s+\d{4})",
        r"executed\s+on\s+(\w+\s+\d{1,2},?\s+\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_date = match.group(1).strip()
            try:
                parsed = date_parser.parse(raw_date, dayfirst=True)
                return parsed.strftime("%d-%b-%Y")
            except Exception:
                return raw_date
    return None


# ─────────────────────────────────────────
# Issuing company name extraction
# ─────────────────────────────────────────

def extract_issuing_company_name(text: str) -> str | None:
    patterns = [
        r"BY AND BETWEEN\s+([A-Za-z][A-Za-z\s\.\,]+?)\s*,\s*having its corporate office",
        r"([A-Za-z][A-Za-z\s\.\,]+?)\s*,\s*having its corporate office",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name)
            if 3 <= len(name) <= 100:
                return name
    return None


# ─────────────────────────────────────────
# Company address extraction
# ─────────────────────────────────────────

def extract_company_address(text: str) -> str | None:
    patterns = [
        r"corporate office at\s*,?\s*(.+?)\s*\(hereinafter referred to as the [\"']Company[\"']",
        r"corporate office at\s*,?\s*(.+?)\s*\(hereinafter",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            address = match.group(1).strip()
            address = re.sub(r'\s+', ' ', address)
            if 5 <= len(address) <= 300:
                return address
    return None


# ─────────────────────────────────────────
# Vendor name extraction
# ─────────────────────────────────────────

def extract_vendor_name(text: str) -> str | None:
    patterns = [
        r"AND\s+([A-Za-z][A-Za-z\s\.\,&]+?)\s*\(Vendor\)",
        r"([A-Za-z][A-Za-z\s\.\,&]+?)\s*\(Vendor\)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name)
            if 2 <= len(name) <= 100:
                return name
    return None


# ─────────────────────────────────────────
# Trainer name extraction
# ─────────────────────────────────────────

def extract_trainer_name_mou(text: str) -> str | None:
    patterns = [
        r"([A-Za-z][A-Za-z\s\.]+?)\s*\(Trainer\)",
        r"([A-Za-z][A-Za-z\s\.]+?)\s*\(Consultant\)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name)
            if 2 <= len(name) <= 50:
                return name
    return None


# ─────────────────────────────────────────
# Vendor address extraction
# ─────────────────────────────────────────

def extract_vendor_address(text: str) -> str | None:
    patterns = [
        r"residing at\s+(.+?)\s*(?:,\s*[A-Z]{5}[0-9]{4}[A-Z]|,\s*\d{4}\s+\d{4}|\(hereinafter)",
        r"residing at\s+(.+?)\s*\(hereinafter",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            address = match.group(1).strip()
            address = re.sub(r'\s+', ' ', address)
            if 5 <= len(address) <= 300:
                return address
    return None


# ─────────────────────────────────────────
# Signatory extraction
# ─────────────────────────────────────────

def extract_signatories(text: str) -> dict:
    result = {
        "company_signatory_name": None,
        "company_signatory_title": None,
        "vendor_signatory_name": None,
        "vendor_signatory_title": None,
    }

    # Find the signature section
    sig_section_match = re.search(
        r"IN WITNESS WHEREOF(.+?)(?:---\s*END\s*---|$)",
        text, re.IGNORECASE | re.DOTALL
    )
    if not sig_section_match:
        return result

    sig_text = sig_section_match.group(1)

    # pdfplumber reads two-column signature blocks as single lines:
    # "Name: Senthil Kumar T P Name: Arjun"
    # "Title: President Title: Consultant"
    # So we extract both values from each line using specific patterns

    # Extract names line — "Name: [company_name] Name: [vendor_name]"
    names_line_match = re.search(
        r"Name\s*:\s*([A-Za-z][A-Za-z\s\.]+?)\s+Name\s*:\s*([A-Za-z][A-Za-z\s\.]+?)(?:\n|$)",
        sig_text, re.IGNORECASE
    )
    if names_line_match:
        result["company_signatory_name"] = names_line_match.group(1).strip()
        result["vendor_signatory_name"] = names_line_match.group(2).strip()
    else:
        # Fallback: single column — just get first Name:
        name_match = re.search(r"Name\s*:\s*([A-Za-z][A-Za-z\s\.]+?)(?:\n|$)", sig_text)
        if name_match:
            result["company_signatory_name"] = name_match.group(1).strip()

    # Extract titles line — "Title: President Title: Consultant"
    titles_line_match = re.search(
        r"Title\s*:\s*([A-Za-z][A-Za-z\s\.]+?)\s+Title\s*:\s*([A-Za-z][A-Za-z\s\.]+?)(?:\n|$)",
        sig_text, re.IGNORECASE
    )
    if titles_line_match:
        result["company_signatory_title"] = titles_line_match.group(1).strip()
        result["vendor_signatory_title"] = titles_line_match.group(2).strip()
    else:
        # Fallback: single column — just get first Title:
        title_match = re.search(r"Title\s*:\s*([A-Za-z][A-Za-z\s\.]+?)(?:\n|$)", sig_text)
        if title_match:
            result["company_signatory_title"] = title_match.group(1).strip()

    return result


# ─────────────────────────────────────────
# Master extraction function
# ─────────────────────────────────────────

def extract_mou_fields(text: str) -> dict:
    signatories = extract_signatories(text)

    return {
        "mou_date": extract_mou_date(text),
        "issuing_company_name": extract_issuing_company_name(text),
        "company_address": extract_company_address(text),
        "vendor_name": extract_vendor_name(text),
        "trainer_name": extract_trainer_name_mou(text),
        "vendor_address": extract_vendor_address(text),
        "company_signatory_name": signatories["company_signatory_name"],
        "company_signatory_title": signatories["company_signatory_title"],
        "vendor_signatory_name": signatories["vendor_signatory_name"],
        "vendor_signatory_title": signatories["vendor_signatory_title"],
    }