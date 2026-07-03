import tempfile
import os
import json
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from services.parser import extract_text
from services.pattern_extraction import extract_fields_pattern
from services.ai_extraction import extract_fields_from_text
from services.generator import generate_document
from models.database import get_db
from models.schemas import DocumentRecord
from pydantic import BaseModel
from typing import Any, Dict, Optional

router = APIRouter()

_temp_extraction_store = {}
_extraction_jobs = {}


@router.get("/extract/status/{job_id}")
def get_extraction_status(job_id: str):
    status = _extraction_jobs.get(job_id)
    if not status:
        raise HTTPException(status_code=404, detail={"error": "Job not found"})
    return status


@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    _extraction_jobs[job_id] = {"stage": "uploading", "progress": 10}

    allowed_extensions = {"pdf", "docx"}
    extension = file.filename.lower().split(".")[-1]

    if extension not in allowed_extensions:
        _extraction_jobs.pop(job_id, None)
        raise HTTPException(status_code=422, detail={"error": "Unsupported file type"})

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{extension}") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    _extraction_jobs[job_id] = {"stage": "parsing", "progress": 30}

    try:
        raw_text = extract_text(tmp_path, file.filename)
    except Exception as e:
        os.remove(tmp_path)
        _extraction_jobs.pop(job_id, None)
        raise HTTPException(status_code=422, detail={"error": f"Failed to parse document: {str(e)}"})

    os.remove(tmp_path)

    _extraction_jobs[job_id] = {"stage": "extracting", "progress": 60}

    # Step 1: pattern matching — 10 fields
    pattern_fields = extract_fields_pattern(raw_text)

    _extraction_jobs[job_id] = {"stage": "ai_extraction", "progress": 80}

    # Step 2: TinyLlama via Ollama — 4 LLM fields
    try:
        llm_raw = extract_fields_from_text(raw_text)
        llm_fields = {
            "issuing_company_name": llm_raw.get("issuing_company") or llm_raw.get("issuing_company_name"),
            "vendor_name": llm_raw.get("vendor_name"),
            "technology": llm_raw.get("technology"),
            "trainer_name": llm_raw.get("trainer_name"),
        }
    except Exception:
        llm_fields = {
            "issuing_company_name": None,
            "vendor_name": None,
            "technology": None,
            "trainer_name": None,
        }

    # Step 3: merge — 14 fields total
    extracted_fields = {**pattern_fields, **llm_fields}

    source_document_id = f"tmp_{uuid.uuid4().hex[:8]}"
    _temp_extraction_store[source_document_id] = extracted_fields

    confidence_warnings = [
        f"'{field}' could not be extracted — please fill in manually"
        for field, value in extracted_fields.items()
        if value is None
    ]

    _extraction_jobs[job_id] = {"stage": "complete", "progress": 100}

    return {
        "job_id": job_id,
        "source_document_id": source_document_id,
        "extracted_fields": extracted_fields,
        "confidence_warnings": confidence_warnings,
        "suggested_output_type": "po",
        "suggested_company_id": "aca-technologies",
    }


class TransformRequest(BaseModel):
    source_document_id: Optional[str] = None
    output_document_type: str
    company_id: str
    output_format: str
    fields: Dict[str, Any]


@router.post("/transform")
def transform_document(request: TransformRequest, db: Session = Depends(get_db)):
    try:
        file_path = generate_document(
            request.output_document_type,
            request.company_id,
            request.output_format,
            request.fields,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=422, detail={"error": str(e)})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"error": f"Generation failed: {str(e)}"})

    filename = os.path.basename(file_path)

    record = DocumentRecord(
        document_type=request.output_document_type,
        company_id=request.company_id,
        output_format=request.output_format,
        filename=filename,
        fields_json=json.dumps(request.fields),
        source_document_id=request.source_document_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    media_type = "application/pdf" if request.output_format == "pdf" else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
        headers={"X-Document-Id": str(record.id)},
    )


def get_stored_extraction(source_document_id: str) -> dict:
    return _temp_extraction_store.get(source_document_id)