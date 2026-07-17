from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey  # type: ignore[import]
from sqlalchemy.sql import func  # type: ignore[import]
from models.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)

class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String, nullable=False)
    company_id = Column(String, nullable=False)
    output_format = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    fields_json = Column(Text, nullable=False)
    source_document_id = Column(String, nullable=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    mou_company_id = Column(Integer, ForeignKey("mou_companies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    trainer_code = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    aadhaar = Column(String, nullable=True)
    payment_status = Column(String, nullable=False, default="Pending")
    paid_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InvoiceCounter(Base):
    __tablename__ = "invoice_counter"

    id = Column(Integer, primary_key=True)
    last_number = Column(Integer, nullable=False, default=0)

class TrainerCounter(Base):
    __tablename__ = "trainer_counter"

    id = Column(Integer, primary_key=True)
    last_number = Column(Integer, nullable=False, default=0)

class MouCompanyCounter(Base):
    __tablename__ = "mou_company_counter"

    id = Column(Integer, primary_key=True)
    last_number = Column(Integer, nullable=False, default=0)

class WarningEmailLog(Base):
    __tablename__ = "warning_email_log"

    id = Column(Integer, primary_key=True, index=True)
    recipient_name = Column(String, nullable=False)
    recipient_email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class EmailSettings(Base):
    __tablename__ = "email_settings"

    id = Column(Integer, primary_key=True)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_user = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    from_name = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ReceivedDocument(Base):
    __tablename__ = "received_documents"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    doc_type = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    finance_details_json = Column(Text, nullable=True)

class MouCompany(Base):
    __tablename__ = "mou_companies"

    id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    signatory_name = Column(String, nullable=True)
    signatory_title = Column(String, nullable=True)
    email = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    trainer_contact = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FinanceRecord(Base):
    __tablename__ = "finance_records"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    amount_received = Column(Float, nullable=False)
    receiving_date = Column(String, nullable=False)  # "YYYY-MM-DD"
    trainer_name = Column(String, nullable=False)     # free text — manual entry, not a strict FK
    amount_sent = Column(Float, nullable=False)
    sending_date = Column(String, nullable=False)      # "YYYY-MM-DD"
    notes = Column(String, nullable=True)               # the only optional field
    created_at = Column(DateTime(timezone=True), server_default=func.now())