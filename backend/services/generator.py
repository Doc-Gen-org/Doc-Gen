from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright
from docxtpl import DocxTemplate
import os
import re
import uuid
from datetime import datetime
from collections import OrderedDict

from services.mou_defaults import ACA_MOU_DEFAULTS
from services.app_paths import TEMPLATES_DIR, GENERATED_FILES_DIR as OUTPUT_DIR

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), auto_reload=True)

CERTIFICATE_DEFAULTS = {
    "signatory_name": "Priyadharshini A",
    "signatory_title": "CEO",
}


def markdown_bold(text):
    if text is None:
        return ""
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)


jinja_env.filters["mdbold"] = markdown_bold


# Which fields dict key holds the "person" this document is about, per type
_PERSON_NAME_FIELDS = {
    "invoice": "trainer_name",
    "po": "trainer_name",
    "mou": "first_party_full_name",
    "certificate": "intern_name",
    "offer_letter": "intern_name",
}


def _sanitize_filename_part(text: str) -> str:
    """Collapse a human-entered name into a safe, readable filename segment."""
    text = (text or "").strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "_", text)
    return text or "unknown"


def _build_output_filename(document_type: str, fields: dict, extension: str) -> str:
    """e.g. 'siddharth_invoice_20260902_a1b2c3.docx' instead of a bare uuid."""
    name_field = _PERSON_NAME_FIELDS.get(document_type)
    person_name = _sanitize_filename_part(fields.get(name_field)) if name_field else "document"
    date_str = datetime.now().strftime("%Y%m%d")
    code = uuid.uuid4().hex[:6]
    return f"{person_name}_{document_type}_{date_str}_{code}.{extension}"


def _format_attended_dates(fields: dict) -> dict:
    """
    Takes fields["attended_dates"] (a list of "YYYY-MM-DD" strings from
    the calendar picker) and computes a clean, grouped display string
    plus a day count. Purely informational — never touches the item
    table's blank Qty field, which the trainer fills in themselves.
    """
    raw_dates = fields.get("attended_dates")
    if not raw_dates:
        fields["attended_dates_count"] = 0
        fields["attended_dates_display"] = ""
        return fields

    parsed = []
    for d in raw_dates:
        try:
            parsed.append(datetime.strptime(d, "%Y-%m-%d").date())
        except (ValueError, TypeError):
            continue

    parsed.sort()

    groups = OrderedDict()
    for d in parsed:
        key = (d.year, d.month)
        groups.setdefault(key, []).append(d.day)

    def _compress_days(days):
        ranges, start, end = [], days[0], days[0]
        for day in days[1:]:
            if day == end + 1:
                end = day
            else:
                ranges.append(str(start) if start == end else f"{start}-{end}")
                start = end = day
        ranges.append(str(start) if start == end else f"{start}-{end}")
        return ", ".join(ranges)

    parts = []
    for (year, month), days in groups.items():
        month_name = datetime(year, month, 1).strftime("%b %Y")
        parts.append(f"{month_name}: {_compress_days(days)}")

    fields["attended_dates_count"] = len(parsed)
    fields["attended_dates_display"] = " | ".join(parts)
    return fields


def _format_engagement_dates(fields: dict) -> dict:
    """
    Same idea as _format_attended_dates, but for the PO's Engagement
    Dates block — one line per month ("August - 1, 2, 3"), since
    that's the requested display shape rather than a single
    semicolon-joined line. Returns HTML with <br> between lines, so
    the template renders it with the |safe filter.
    """
    raw_dates = fields.get("engagement_dates")
    if not raw_dates:
        fields["engagement_dates_display"] = ""
        return fields

    parsed = []
    for d in raw_dates:
        try:
            parsed.append(datetime.strptime(d, "%Y-%m-%d").date())
        except (ValueError, TypeError):
            continue

    parsed.sort()

    groups = OrderedDict()
    for d in parsed:
        key = (d.year, d.month)
        groups.setdefault(key, []).append(d.day)

    def _compress_days(days):
        # Collapse consecutive days into "start-end" ranges
        ranges, start, end = [], days[0], days[0]
        for day in days[1:]:
            if day == end + 1:
                end = day
            else:
                ranges.append(str(start) if start == end else f"{start}-{end}")
                start = end = day
        ranges.append(str(start) if start == end else f"{start}-{end}")
        return ", ".join(ranges)

    lines = []
    for (year, month), days in groups.items():
        month_name = datetime(year, month, 1).strftime("%b")
        lines.append(f"{month_name} {_compress_days(days)}")

    fields["engagement_dates_display"] = "<br>".join(lines)
    return fields


def generate_pdf(document_type: str, company_id: str, fields: dict) -> str:
    template_path = f"{document_type}/{company_id}.html"

    try:
        template = jinja_env.get_template(template_path)
    except Exception as e:
        raise FileNotFoundError(
            f"No PDF template found for document_type='{document_type}', company_id='{company_id}'"
        ) from e

    import logging
    logging.getLogger("uvicorn").info(f"[TEMPLATE] Loading from: {TEMPLATES_DIR}/{template_path}")
    print(f"[TEMPLATE DEBUG] Path: {TEMPLATES_DIR}\\{template_path}", flush=True)

    rendered_html = template.render(**fields)
    print(f"[TEMPLATE DEBUG] SAMPLE in HTML: {'SAMPLE' in rendered_html}", flush=True)

    filename = _build_output_filename(document_type, fields, "pdf")
    output_path = os.path.join(OUTPUT_DIR, filename)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(rendered_html)
        page.pdf(path=output_path, format="A4", print_background=True)
        browser.close()

    return output_path


def generate_docx(document_type: str, company_id: str, fields: dict) -> str:
    template_path = os.path.join(TEMPLATES_DIR, document_type, f"{company_id}.docx")

    if not os.path.exists(template_path):
        raise FileNotFoundError(
            f"No DOCX template found for document_type='{document_type}', company_id='{company_id}'"
        )

    doc = DocxTemplate(template_path)
    doc.render(fields)

    filename = _build_output_filename(document_type, fields, "docx")
    output_path = os.path.join(OUTPUT_DIR, filename)
    doc.save(output_path)

    return output_path


def generate_document(document_type: str, company_id: str, output_format: str, fields: dict) -> str:
    if document_type == "mou":
        fields = {**ACA_MOU_DEFAULTS, **fields}
    elif document_type == "certificate":
        fields = {**CERTIFICATE_DEFAULTS, **fields}
    elif document_type == "po":
        fields = _format_engagement_dates(dict(fields))
    elif document_type == "invoice":
        fields = _format_attended_dates(dict(fields))

    if output_format == "pdf":
        return generate_pdf(document_type, company_id, fields)
    elif output_format == "docx":
        return generate_docx(document_type, company_id, fields)
    else:
        raise ValueError(f"Unsupported output_format: {output_format}")