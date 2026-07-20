from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import health, documents, extraction, history
from models.database import Base, engine
from models import schemas
from routes import trainers, email as email_routes, warnings, settings, received_documents, mou_companies, ai, finance, interns


Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocGen Backend")

# This is a fully local, single-user desktop app — the backend only
# ever listens on localhost and there's no auth/session cookies to
# protect, so there's no meaningful cross-origin threat here. Origin
# restriction matters in dev (http://localhost:5173, the Vite server)
# but the packaged app loads the frontend via file://, which sends a
# "null" origin — a fixed allow-list would silently block every API
# call once packaged. allow_credentials=False + allow_origins=["*"]
# is intentional, not a placeholder.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Document-Id"],
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
app.include_router(finance.router)
app.include_router(interns.router)


if __name__ == "__main__":
    # Entrypoint for the PyInstaller-built executable — Electron spawns
    # this directly in the packaged app rather than running
    # `uvicorn main:app` from a shell. Dev mode is unaffected: you
    # still run it however you already do (uvicorn main:app --reload).
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)