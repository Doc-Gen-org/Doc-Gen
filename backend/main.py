from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import health, documents, extraction, history
from models.database import Base, engine
from models import schemas
from routes import trainers, email as email_routes, warnings, settings, received_documents, mou_companies, ai


Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocGen Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(extraction.router)
app.include_router(history.router)
app.include_router(trainers.router)
app.include_router(email_routes.router)
app.include_router(warnings.router)
app.include_router(settings.router)
app.include_router(received_documents.router)
app.include_router(mou_companies.router)
app.include_router(ai.router)