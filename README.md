<div align="center">

# DocGen

**A local-first desktop app for generating, extracting, and sending business documents.**

Purchase orders, MoUs, trainer invoices, internship offer letters and certificates, with an on-device AI assistant and no cloud dependency.

![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-desktop-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![Status](https://img.shields.io/badge/status-work%20in%20progress-orange)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Documents](#supported-documents)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Building the Windows Installer](#building-the-windows-installer)
- [API Overview](#api-overview)
- [Data and Privacy](#data-and-privacy)
- [Project Status](#project-status)
- [License](#license)

---

## Overview

DocGen automates the paperwork a training and internship operation produces every day. It can:

- **Extract** structured fields from uploaded purchase orders (PDF or DOCX) using text parsing, OCR, pattern matching, and a local LLM.
- **Generate** polished PDF and DOCX documents from branded templates.
- **Track** trainers, MoU partner companies, interns, finance records, and every document generated.
- **Email** documents directly from the app over SMTP.

DocGen runs entirely on the user's machine. The React interface, Python backend, database, OCR engine, and language models are bundled together, so no document ever leaves the computer unless you choose to email it.

<!--
Add screenshots here once available, e.g.:
![Dashboard](docs/screenshots/dashboard.png)
-->

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | At-a-glance overview of your activity and key figures. |
| **Editor** | Upload a PO (PDF or DOCX), auto-extract its fields, review and correct them, then generate the final document and optionally email it. Extraction progress is reported live. |
| **Creator** | Generate a document from scratch using a dynamic form built from the document type definitions. |
| **Trainers** | Manage trainers, generate an invoice from a PO, send documents, store received documents, view finance details, and see each trainer's document status. |
| **MoU Companies** | Maintain partner companies, generate and preview MoUs. |
| **Interns** | Manage interns, generate and email offer letters and completion certificates. An AI assistant rewrites rough contribution notes into polished certificate wording. |
| **Finance** | Record money received and paid, view a summary, and export to CSV. |
| **History** | Browse every generated document, re-download it, or inspect the fields used. |
| **Warnings** | Send and log templated warning emails to recipients. |
| **Settings** | Configure SMTP email settings and send a test message. |

**Highlights**

- Fully offline document intelligence through a bundled [Ollama](https://ollama.com) runtime.
- OCR fallback for scanned PDFs using Tesseract and Poppler.
- Auto-numbering for POs, invoices, trainers, interns, and MoU companies.
- Multi-date picker for recording training days attended.
- Packaged as a single Windows installer with every native dependency included.

## Supported Documents

| Type | Format | Notes |
| --- | --- | --- |
| Purchase Order | PDF / DOCX | Client, trainer, technology, dates, quantity, rate, and total. |
| Memorandum of Understanding | PDF | Party details, signatories, witnesses, and signature blocks. |
| Trainer Invoice | DOCX / HTML | Blank item table, or generated from a received PO. |
| Offer Letter | PDF | For interns. |
| Internship Certificate | PDF | For interns, with AI-refined contribution text. |
| Email Template | Email | Training schedule, meeting link, and pay details. |

Templates live in `backend/templates/<document-type>/` and are rendered with Jinja2, WeasyPrint, and docxtpl.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Desktop shell | Electron, electron-builder |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Framer Motion, Recharts |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy |
| Database | SQLite |
| Document engine | Jinja2, WeasyPrint (HTML to PDF), docxtpl and python-docx (DOCX) |
| Extraction | pdfplumber, pdf2image + Poppler, pytesseract + Tesseract OCR, regex pattern extraction |
| Local AI | Ollama with `tinyllama-po` (field extraction) and `llama3.2:3b` (certificate text refinement) |
| Packaging | PyInstaller (backend), electron-builder, Inno Setup (installer) |

## Architecture

```
┌─────────────────────────────── Electron shell ───────────────────────────────┐
│                                                                              │
│   React + TypeScript UI  ──HTTP──▶  FastAPI backend (127.0.0.1:8000)         │
│   (Vite in dev, static                  │                                    │
│    build when packaged)                 ├──▶ SQLite (trainers, interns,      │
│                                         │     documents, finance, settings)  │
│                                         ├──▶ Jinja2 / WeasyPrint / docxtpl   │
│                                         │     (document generation)          │
│                                         ├──▶ Tesseract + Poppler (OCR)       │
│                                         ├──▶ SMTP (outgoing email)           │
│                                         └──▶ Ollama (127.0.0.1:11434)        │
│                                               local LLM inference            │
└──────────────────────────────────────────────────────────────────────────────┘
```

In a packaged build, Electron starts the backend and Ollama as child processes and shuts them down when the app quits. If something is already listening on port `8000` or `11434`, Electron reuses it instead of starting a second copy. In development you run those services yourself.

## Project Structure

```
Doc-Gen/
├── electron/              # Electron main process (spawns backend and Ollama)
│   └── main.js
├── frontend/              # React + TypeScript + Vite UI
│   └── src/
│       ├── pages/         # Dashboard, Editor, Creator, Trainers, Interns, Finance, ...
│       ├── components/    # Layout, sidebar, splash screen, shared UI
│       ├── contexts/      # Toast and confirm-dialog providers
│       ├── lib/api/       # Typed API clients, one per backend module
│       └── routes.tsx     # Route and navigation definitions
├── backend/               # FastAPI service
│   ├── main.py            # App entry point
│   ├── config/            # Document type and field definitions
│   ├── models/            # SQLAlchemy models and database setup
│   ├── routes/            # API routers (documents, trainers, interns, finance, ...)
│   ├── services/          # Parsing, extraction, generation, email, counters
│   └── templates/         # HTML and DOCX templates per document type
├── installer.iss          # Inno Setup script for the Windows installer
└── package.json           # Electron scripts and electron-builder config
```

## Getting Started

### Prerequisites

| Requirement | Purpose |
| --- | --- |
| [Node.js](https://nodejs.org) 20+ and npm | Frontend and Electron |
| [Python](https://www.python.org) 3.10+ | Backend |
| [Ollama](https://ollama.com) | Local language models |
| [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) | Reading scanned PDFs |
| [Poppler](https://github.com/oschwartz10612/poppler-windows) | PDF to image conversion |
| [GTK3 runtime](https://www.gtk.org) | Required by WeasyPrint on Windows |

### 1. Clone the repository

```bash
git clone https://github.com/Doc-Gen-org/Doc-Gen.git
cd Doc-Gen
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

If Tesseract or Poppler are not on your `PATH`, point the backend at them:

```bash
set TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
set POPPLER_PATH=C:\path\to\poppler\bin
```

### 3. Set up the local AI models

```bash
ollama pull llama3.2:3b
ollama create tinyllama-po -f <path-to-Modelfile>
```

`tinyllama-po` is a custom model used for purchase order field extraction. The app falls back gracefully if extraction returns nothing, but results are best with the model installed.

### 4. Install frontend and Electron dependencies

```bash
cd ..
npm install
npm --prefix frontend install
```

### 5. Run in development

Start the backend in one terminal:

```bash
cd backend
uvicorn main:app --reload
```

Make sure Ollama is running (`ollama serve`, or let its background service handle it), then in a second terminal from the project root:

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` and opens the Electron window once it is ready.

| Service | Address |
| --- | --- |
| Frontend (Vite) | `http://localhost:5173` |
| Backend (FastAPI) | `http://127.0.0.1:8000` (interactive docs at `/docs`) |
| Ollama | `http://127.0.0.1:11434` |

## Configuration

### Email (SMTP)

The easiest way is the **Settings** page inside the app, which stores the SMTP details in the local database and includes a test-email button.

Alternatively, create `backend/.env`. These values are used when no settings are saved in the app:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=you@example.com
FROM_NAME=Your Organisation
```

> **Tip:** For Gmail and similar providers, use an app-specific password rather than your account password. Never commit `.env`; it is already listed in `.gitignore`.

### Environment variables

| Variable | Description |
| --- | --- |
| `TESSERACT_PATH` | Full path to `tesseract.exe` if it is not on `PATH`. |
| `POPPLER_PATH` | Path to Poppler's `bin` folder if it is not on `PATH`. |
| `SMTP_*`, `FROM_*` | Fallback email settings (see above). |

## Building the Windows Installer

Packaging happens in three stages. Native dependencies are placed under a `resources/` folder, which is git-ignored.

1. **Build the backend executable** with PyInstaller (see `backend/docgen_backend.spec`). Output goes to `resources/backend/`.
2. **Place bundled runtimes** in `resources/`: `ollama/` (with its `models/` folder), `tesseract/`, `poppler/`, and `gtk3-runtime/`.
3. **Build the Electron app:**

   ```bash
   npm run dist
   ```

   This builds the frontend and produces an unpacked app in `release/win-unpacked/`.
4. **Create the installer** by compiling `installer.iss` with [Inno Setup](https://jrsoftware.org/isinfo.php):

   ```bash
   "C:\Program Files\Inno Setup 6\ISCC.exe" installer.iss
   ```

   The output lands in `installer_output/`. Because the bundle with Ollama and its models is large, the installer uses disk spanning: distribute the **whole `installer_output` folder** (or a zip of it), not just the `.exe`.

Run `npm run dist` again before every installer build so it packages current code.

## API Overview

The backend exposes a REST API at `http://127.0.0.1:8000`. Full interactive documentation is available at `/docs` while the backend is running.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Documents | `GET /document-types`, `POST /generate`, `POST /transform` |
| Extraction | `POST /extract`, `GET /extract/status/{job_id}` |
| History | `GET /history`, `GET /history/{id}/download`, `GET /history/{id}/fields`, `DELETE /history/{id}` |
| Trainers | `/trainers`, `/trainers/{id}/received`, `/trainers/{id}/generate-invoice-from-po`, `/trainers/{id}/send-document` |
| MoU Companies | `/mou-companies` and per-company document previews |
| Interns | `/interns`, `/interns/{id}/generate-offer-letter`, `/interns/{id}/generate-certificate`, plus send endpoints |
| Finance | `GET/POST /finance/records`, `GET /finance/summary`, `GET /finance/export` |
| Email | `POST /send-email`, `GET/POST /settings/email`, `POST /settings/email/test` |
| Warnings | `GET /warnings`, `POST /warnings/send` |
| AI | `POST /ai/refine-contribution` |

## Data and Privacy

- The backend listens on `127.0.0.1` only. DocGen is designed as a single-user, local desktop application.
- All AI inference runs locally through Ollama. No document text is sent to an external AI service.
- In development, the database and generated files are stored under `backend/`. In a packaged build they are stored in the user's per-user application data folder, so they survive upgrades and never live inside the install directory.
- SMTP credentials entered in Settings are stored in the local SQLite database.
- The database, `generated_files/`, `uploaded_documents/`, and `received_documents/` are git-ignored so real client data stays out of version control.

## Project Status

DocGen is under active development. Interfaces, templates, and the data model may change between versions. Issues and suggestions are welcome through the [issue tracker](https://github.com/Doc-Gen-org/Doc-Gen/issues).

## License

Released under the ISC License.
