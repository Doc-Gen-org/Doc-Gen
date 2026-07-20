"""
Single source of truth for every filesystem path the backend uses.

Two different kinds of paths, handled differently:

- Read-only bundled resources (Jinja2 templates) — these ship inside
  the app itself. Under PyInstaller they live in a temp extraction
  folder (sys._MEIPASS), not next to the running .exe.

- Writable persistent data (the database, generated files, uploads,
  received documents) — these must NEVER live inside the app's own
  install location. A packaged app is often installed somewhere the
  process can't write to (e.g. Program Files), and PyInstaller's
  onefile temp-extraction folder is wiped between runs anyway. These
  go to the platform's proper per-user app-data directory instead.

Dev mode (plain `python main.py` / `uvicorn`, not a frozen .exe)
keeps the exact original behavior — everything relative to the
backend/ folder — so the existing day-to-day workflow is untouched.
Only a packaged build behaves differently.
"""

import os
import sys


def _is_frozen() -> bool:
    return getattr(sys, "frozen", False)


def _backend_root() -> str:
    if _is_frozen():
        return sys._MEIPASS  # type: ignore[attr-defined]
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _writable_data_root() -> str:
    if not _is_frozen():
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if sys.platform == "win32":
        base = os.environ.get("APPDATA", os.path.expanduser("~"))
    elif sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME", os.path.expanduser("~/.local/share"))

    return os.path.join(base, "DocGen")


TEMPLATES_DIR = os.path.join(_backend_root(), "templates")

DATA_DIR = _writable_data_root()
GENERATED_FILES_DIR = os.path.join(DATA_DIR, "generated_files")
UPLOADED_DOCUMENTS_DIR = os.path.join(DATA_DIR, "uploaded_documents")
RECEIVED_DOCUMENTS_DIR = os.path.join(DATA_DIR, "received_documents")
DB_PATH = os.path.join(DATA_DIR, "docgen.db")

for _dir in (DATA_DIR, GENERATED_FILES_DIR, UPLOADED_DOCUMENTS_DIR, RECEIVED_DOCUMENTS_DIR):
    os.makedirs(_dir, exist_ok=True)