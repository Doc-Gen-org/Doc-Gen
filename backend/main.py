from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import health, documents, extraction, history
from models.database import Base, engine
from models import schemas

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