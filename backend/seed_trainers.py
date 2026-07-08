from models.database import SessionLocal
from models.schemas import Trainer

db = SessionLocal()
db.add(Trainer(name="Anil", email="anil.testtrainer@example.com", phone="9876543210"))
db.commit()
db.close()
print("Seeded sample trainer: Anil")