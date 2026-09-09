from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.database import get_db
from models.schemas import PasswordCategory, PasswordEntry

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class EntryCreate(BaseModel):
    category_id: int
    title: str
    username: str | None = None
    password: str | None = None
    url: str | None = None
    notes: str | None = None


class EntryUpdate(BaseModel):
    title: str | None = None
    username: str | None = None
    password: str | None = None
    url: str | None = None
    notes: str | None = None


def _serialize_category(c: PasswordCategory, db: Session):
    entry_count = db.query(PasswordEntry).filter(PasswordEntry.category_id == c.id).count()
    return {"id": c.id, "name": c.name, "entry_count": entry_count}


def _serialize_entry(e: PasswordEntry):
    return {
        "id": e.id,
        "category_id": e.category_id,
        "title": e.title,
        "username": e.username,
        "password": e.password,
        "url": e.url,
        "notes": e.notes,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


@router.get("/password-categories")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(PasswordCategory).order_by(PasswordCategory.name).all()
    return {"categories": [_serialize_category(c, db) for c in categories]}


@router.post("/password-categories")
def create_category(request: CategoryCreate, db: Session = Depends(get_db)):
    if not request.name.strip():
        raise HTTPException(status_code=422, detail={"error": "Category name can't be empty"})

    category = PasswordCategory(name=request.name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return _serialize_category(category, db)


@router.patch("/password-categories/{category_id}")
def rename_category(category_id: int, request: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(PasswordCategory).filter(PasswordCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail={"error": "Category not found"})

    if not request.name.strip():
        raise HTTPException(status_code=422, detail={"error": "Category name can't be empty"})

    category.name = request.name.strip()
    db.commit()
    db.refresh(category)
    return _serialize_category(category, db)


@router.delete("/password-categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(PasswordCategory).filter(PasswordCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail={"error": "Category not found"})

    db.query(PasswordEntry).filter(PasswordEntry.category_id == category_id).delete()
    db.delete(category)
    db.commit()
    return {"message": f"Category {category_id} and its entries deleted successfully"}


@router.get("/password-entries")
def list_entries(category_id: int, db: Session = Depends(get_db)):
    entries = (
        db.query(PasswordEntry)
        .filter(PasswordEntry.category_id == category_id)
        .order_by(PasswordEntry.title)
        .all()
    )
    return {"entries": [_serialize_entry(e) for e in entries]}


@router.post("/password-entries")
def create_entry(request: EntryCreate, db: Session = Depends(get_db)):
    category = db.query(PasswordCategory).filter(PasswordCategory.id == request.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail={"error": "Category not found"})

    if not request.title.strip():
        raise HTTPException(status_code=422, detail={"error": "Title can't be empty"})

    entry = PasswordEntry(
        category_id=request.category_id,
        title=request.title.strip(),
        username=request.username,
        password=request.password,
        url=request.url,
        notes=request.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize_entry(entry)


@router.patch("/password-entries/{entry_id}")
def update_entry(entry_id: int, request: EntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(PasswordEntry).filter(PasswordEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": "Entry not found"})

    if request.title is not None:
        if not request.title.strip():
            raise HTTPException(status_code=422, detail={"error": "Title can't be empty"})
        entry.title = request.title.strip()
    if request.username is not None:
        entry.username = request.username
    if request.password is not None:
        entry.password = request.password
    if request.url is not None:
        entry.url = request.url
    if request.notes is not None:
        entry.notes = request.notes

    db.commit()
    db.refresh(entry)
    return _serialize_entry(entry)


@router.delete("/password-entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(PasswordEntry).filter(PasswordEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail={"error": "Entry not found"})

    db.delete(entry)
    db.commit()
    return {"message": f"Entry {entry_id} deleted successfully"}