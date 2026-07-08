from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from docxtpl import DocxTemplate
import os
import re
import uuid

from services.field_mapping import map_mou_fields

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_files")

os.makedirs(OUTPUT_DIR, exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def markdown_bold(text):
    """
    Converts **bolded text** within a field into <strong> tags,
    so ACA staff can mark specific phrases as bold without needing
    a separate field per bolded segment. Used via the `mdbold` filter.
    """
    if text is None:
        return ""
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)


jinja_env.filters["mdbold"] = markdown_bold


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
        fields = map_mou_fields(fields)

    if output_format == "pdf":
        return generate_pdf(document_type, company_id, fields)
    elif output_format == "docx":
        return generate_docx(document_type, company_id, fields)
    else:
        raise ValueError(f"Unsupported output_format: {output_format}")