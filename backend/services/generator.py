from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from docxtpl import DocxTemplate
import os
import re
import uuid
from datetime import datetime
from collections import OrderedDict

from services.mou_defaults import ACA_MOU_DEFAULTS
from services.app_paths import TEMPLATES_DIR, GENERATED_FILES_DIR as OUTPUT_DIR

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

CERTIFICATE_DEFAULTS = {
    "signatory_name": "Priyadharshini A",
    "signatory_title": "CEO",
}


def markdown_bold(text):
    if text is None:
        return ""
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)


jinja_env.filters["mdbold"] = markdown_bold


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

    parts = []
    for (year, month), days in groups.items():
        month_name = datetime(year, month, 1).strftime("%B %Y")
        day_list = ", ".join(str(day) for day in days)
        parts.append(f"{month_name}: {day_list}")

    fields["attended_dates_count"] = len(parsed)
    fields["attended_dates_display"] = "; ".join(parts)
    return fields


def generate_pdf(document_type: str, company_id: str, fields: dict) -> str:
    template_path = f"{document_type}/{company_id}.html"

    try:
        template = jinja_env.get_template(template_path)
    except Exception as e:
        raise FileNotFoundError(
            f"No PDF template found for document_type='{document_type}', company_id='{company_id}'"
        ) from e

    rendered_html = template.render(**fields)

    filename = f"{document_type}_{company_id}_{uuid.uuid4().hex[:8]}.pdf"
    output_path = os.path.join(OUTPUT_DIR, filename)

    HTML(string=rendered_html).write_pdf(output_path)

    return output_path


def generate_docx(document_type: str, company_id: str, fields: dict) -> str:
    template_path = os.path.join(TEMPLATES_DIR, document_type, f"{company_id}.docx")

    if not os.path.exists(template_path):
        raise FileNotFoundError(
            f"No DOCX template found for document_type='{document_type}', company_id='{company_id}'"
        )

    doc = DocxTemplate(template_path)
    doc.render(fields)

    filename = f"{document_type}_{company_id}_{uuid.uuid4().hex[:8]}.docx"
    output_path = os.path.join(OUTPUT_DIR, filename)
    doc.save(output_path)

    return output_path


def generate_document(document_type: str, company_id: str, output_format: str, fields: dict) -> str:
    if document_type == "mou":
        fields = {**ACA_MOU_DEFAULTS, **fields}
    elif document_type == "certificate":
        fields = {**CERTIFICATE_DEFAULTS, **fields}
    elif document_type == "invoice":
        fields = _format_attended_dates(dict(fields))
        raw_num_rows = fields.get("num_rows")
        if raw_num_rows in (None, ""):
            fields["num_rows"] = None
        else:
            try:
                fields["num_rows"] = int(raw_num_rows)
            except (TypeError, ValueError):
                fields["num_rows"] = None

    if output_format == "pdf":
        return generate_pdf(document_type, company_id, fields)
    elif output_format == "docx":
        return generate_docx(document_type, company_id, fields)
    else:
        raise ValueError(f"Unsupported output_format: {output_format}")