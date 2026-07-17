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
    name = (fields.get("first_party_full_name") or "").strip()
    if not name:
        return None

    normalized = name.lower()
    existing = db.query(MouCompany).all()
    company = next((c for c in existing if c.name.strip().lower() == normalized), None)

    if not company:
        company = MouCompany(company_code=get_next_company_code(db), name=name)
        db.add(company)

    company.address = fields.get("first_party_address") or company.address
    company.signatory_name = fields.get("first_party_signatory_name") or company.signatory_name
    company.signatory_title = fields.get("first_party_sig_designation") or company.signatory_title

    db.commit()
    db.refresh(company)
    return company