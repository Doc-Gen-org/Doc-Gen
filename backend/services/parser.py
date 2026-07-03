import pdfplumber
import docx
import pytesseract
from pdf2image import convert_from_path
import tempfile
import os

# Update these paths to match where you installed Tesseract and Poppler
TESSERACT_PATH = r"C:\Users\sanja\Desktop\Sanjay\tesseract.exe"
POPPLER_PATH = r"C:\Users\sanja\Desktop\Sanjay\Poppler\poppler-26.02.0\Library\bin"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    # If no text was found, the PDF is likely scanned images — fall back to OCR
    if not text.strip():
        text = extract_text_via_ocr(file_path)

    return text.strip()


def extract_text_via_ocr(file_path: str) -> str:
    images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
    text = ""
    for image in images:
        text += pytesseract.image_to_string(image) + "\n"
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    document = docx.Document(file_path)
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    return text.strip()


def extract_text(file_path: str, filename: str) -> str:
    extension = filename.lower().split(".")[-1]

    if extension == "pdf":
        return extract_text_from_pdf(file_path)
    elif extension == "docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {extension}")