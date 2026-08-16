"""
Core backup/restore logic — builds a zip of the whole app's data
(database + every generated/uploaded/received document) and restores
from one later.
"""

import os
import shutil
import zipfile
import tempfile
from datetime import datetime
from fastapi import HTTPException
from services.app_paths import DB_PATH, GENERATED_FILES_DIR, UPLOADED_DOCUMENTS_DIR, RECEIVED_DOCUMENTS_DIR
from models.database import engine

DOCUMENT_FOLDERS = {
    "generated_files": GENERATED_FILES_DIR,
    "uploaded_documents": UPLOADED_DOCUMENTS_DIR,
    "received_documents": RECEIVED_DOCUMENTS_DIR,
}


def build_backup_zip() -> tuple[str, str]:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    zip_filename = f"docgen-backup-{timestamp}.zip"
    zip_path = os.path.join(tempfile.gettempdir(), zip_filename)

    engine.dispose()

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        if os.path.exists(DB_PATH):
            zf.write(DB_PATH, arcname="docgen.db")

        for folder_name, folder_path in DOCUMENT_FOLDERS.items():
            if not os.path.isdir(folder_path):
                continue
            for root, _dirs, files in os.walk(folder_path):
                for f in files:
                    full_path = os.path.join(root, f)
                    arcname = os.path.join(folder_name, os.path.relpath(full_path, folder_path))
                    zf.write(full_path, arcname=arcname)

    return zip_path, zip_filename


def restore_from_zip_path(zip_path: str) -> None:
    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                names = zf.namelist()
                if "docgen.db" not in names:
                    raise HTTPException(
                        status_code=422,
                        detail={"error": "This doesn't look like a DocGen backup — docgen.db wasn't found inside it."},
                    )
                zf.extractall(tmp_dir)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=422, detail={"error": "That file isn't a valid zip archive."})

        engine.dispose()

        extracted_db = os.path.join(tmp_dir, "docgen.db")
        shutil.copy2(extracted_db, DB_PATH)

        for folder_name, folder_path in DOCUMENT_FOLDERS.items():
            extracted_folder = os.path.join(tmp_dir, folder_name)
            if not os.path.isdir(extracted_folder):
                continue
            if os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
            shutil.copytree(extracted_folder, folder_path)

        for folder_path in DOCUMENT_FOLDERS.values():
            os.makedirs(folder_path, exist_ok=True)