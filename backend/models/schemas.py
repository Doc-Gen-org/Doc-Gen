from sqlalchemy import Column, Integer, String, DateTime, Text  # type: ignore[import]
from sqlalchemy.sql import func  # type: ignore[import]
from models.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True)       # e.g. "aca-technologies"
    name = Column(String, nullable=False)        # e.g. "ACA Technologies"

class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String, nullable=False)      # e.g. "po", "invoice"
    company_id = Column(String, nullable=False)
    output_format = Column(String, nullable=False)      # "pdf" or "docx"
    filename = Column(String, nullable=False)
    fields_json = Column(Text, nullable=False)           # stores the full field data as JSON text
    source_document_id = Column(String, nullable=True)   # links transform outputs back to an extraction
    created_at = Column(DateTime(timezone=True), server_default=func.now())