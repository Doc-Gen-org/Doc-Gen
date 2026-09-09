from models.database import SessionLocal, Base, engine
from models.schemas import Company

Base.metadata.create_all(bind=engine)

def seed_companies():
    db = SessionLocal()

    companies = [
        Company(id="aca-technologies", name="ACA Technologies"),
        Company(id="talencia", name="Talencia"),
        Company(id="college-default", name="College (Default)"),
    ]

    for company in companies:
        existing = db.query(Company).filter(Company.id == company.id).first()
        if not existing:
            db.add(company)

    db.commit()
    db.close()
    print("Companies seeded successfully.")

if __name__ == "__main__":
    seed_companies()