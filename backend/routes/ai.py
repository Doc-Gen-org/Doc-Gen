from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_refine import refine_contribution_text

router = APIRouter()


class RefineRequest(BaseModel):
    raw_text: str


@router.post("/ai/refine-contribution")
def refine_contribution(request: RefineRequest):
    try:
        refined = refine_contribution_text(request.raw_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail={"error": str(e)})
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail={"error": str(e)})

    return {"refined_text": refined}