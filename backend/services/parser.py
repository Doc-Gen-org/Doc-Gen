import pdfplumber
import docx
import pytesseract
from pdf2image import convert_from_path
import os
import shutil

# ─────────────────────────────────────────
# Auto-detect Tesseract path
# ─────────────────────────────────────────

def _find_tesseract() -> str:
    # 1. Check environment variable (most portable — set this on any machine)
    env_path = os.environ.get("TESSERACT_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    # 2. Check if tesseract is on system PATH (standard install on Mac/Linux)
    system_path = shutil.which("tesseract")
    if system_path:
        return system_path

    # 3. Check common Windows install locations
    windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\sanja\Desktop\Sanjay\tesseract.exe",
        r"C:\Users\KBsan\Desktop\tesseract.exe",
    ]
    for path in windows_paths:
        if os.path.exists(path):
            return path

    # 4. Search relative to this file (for bundled/portable installs)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bundled_paths = [
        os.path.join(base_dir, "bin", "tesseract.exe"),
        os.path.join(base_dir, "tesseract", "tesseract.exe"),
    ]
    for path in bundled_paths:
        if os.path.exists(path):
            return path

    raise FileNotFoundError(
        "Tesseract not found. Set the TESSERACT_PATH environment variable "
        "to the full path of tesseract.exe on your machine."
    )


# ─────────────────────────────────────────
# Auto-detect Poppler path
# ─────────────────────────────────────────

def _find_poppler() -> str | None:
    # 1. Check environment variable
    env_path = os.environ.get("POPPLER_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    # 2. Check if pdftoppm is on system PATH (Mac/Linux standard install)
    system_path = shutil.which("pdftoppm")
    if system_path:
        # Return the directory containing it, not the binary itself
        return os.path.dirname(system_path)

    # 3. Check common Windows locations
    windows_paths = [
        r"C:\Users\sanja\Desktop\Sanjay\Poppler\poppler-26.02.0\Library\bin",
        r"C:\Users\KBsan\Desktop\Poppler\poppler-26.02.0\Library\bin",
        r"C:\poppler\poppler-26.02.0\Library\bin",
        r"C:\poppler\Library\bin",
        r"C:\Program Files\poppler\bin",
    ]
    for path in windows_paths:
        if os.path.exists(path):
            return path

    # 4. Search relative to this file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bundled_paths = [
        os.path.join(base_dir, "bin", "poppler", "bin"),
        os.path.join(base_dir, "poppler", "bin"),
    ]
    for path in bundled_paths:
        if os.path.exists(path):
            return path

    # Poppler is optional — return None if not found
    # (only needed for OCR fallback on scanned PDFs)
    return None


# ─────────────────────────────────────────
# Initialize paths on module load
# ─────────────────────────────────────────

try:
    TESSERACT_PATH = _find_tesseract()
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    print(f"[parser] Tesseract found at: {TESSERACT_PATH}")
except FileNotFoundError as e:
    TESSERACT_PATH = None
    print(f"[parser] WARNING: {e}")

POPPLER_PATH = _find_poppler()
if POPPLER_PATH:
    print(f"[parser] Poppler found at: {POPPLER_PATH}")
else:
    print("[parser] WARNING: Poppler not found — OCR fallback on scanned PDFs will be unavailable")


# ─────────────────────────────────────────
# Extraction functions
# ─────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        if TESSERACT_PATH and POPPLER_PATH:
            text = extract_text_via_ocr(file_path)
        else:
            raise RuntimeError(
                "This PDF appears to be a scanned image but OCR dependencies "
                "(Tesseract/Poppler) are not available on this machine."
            )

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