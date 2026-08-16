"""
Backup / Restore — export the whole app's data (database + every
generated/uploaded/received document) into one portable zip file,
and restore from one later.
"""

import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from services.backup_service import build_backup_zip, restore_from_zip_path

router = APIRouter()


@router.get("/backup/export")
def export_backup():
    zip_path, zip_filename = build_backup_zip()
    return FileResponse(path=zip_path, media_type="application/zip", filename=zip_filename)


@router.post("/backup/import")
async def import_backup(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=422, detail={"error": "Please upload a .zip backup file."})

    upload_path = os.path.join(tempfile.gettempdir(), "docgen-import-upload.zip")
    contents = await file.read()
    with open(upload_path, "wb") as f:
        f.write(contents)

    try:
        restore_from_zip_path(upload_path)
    finally:
        if os.path.exists(upload_path):
            os.remove(upload_path)

    return {"message": "Backup restored successfully."}