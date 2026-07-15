from sqlalchemy.orm import Session
from models.schemas import MouCompany
from services.mou_company_counter import get_next_company_code


def get_or_create_mou_company(db: Session, fields: dict) -> MouCompany | None:
    """
    Looks up an MOU company by name (case-insensitive, trimmed).
    If found, updates its stored details to whatever was just used
    to generate this MOU (latest generation wins). If not found,
    creates a new record.
    """
    name = (fields.get("vendor_name") or "").strip()
    if not name:
        return None

    normalized = name.lower()
    existing = db.query(MouCompany).all()
    company = next((c for c in existing if c.name.strip().lower() == normalized), None)

    if not company:
        company = MouCompany(company_code=get_next_company_code(db), name=name)
        db.add(company)

    company.address = fields.get("vendor_address") or company.address
    company.signatory_name = fields.get("vendor_signatory_name") or company.signatory_name
    company.signatory_title = fields.get("vendor_signatory_title") or company.signatory_title
    company.email = fields.get("vendor_email") or company.email
    company.pan = fields.get("vendor_pan") or company.pan
    company.trainer_contact = fields.get("vendor_aadhaar") or company.trainer_contact

    db.commit()
    db.refresh(company)
    return company