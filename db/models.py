import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID  # Even in SQLite, SQLAlchemy handles String-UUIDs via this or custom types
from datetime import datetime
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    documents = relationship("Document", back_populates="user")
    financial_profiles = relationship("FinancialProfile", back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    doc_type = Column(String)  # form16|ais|26as|salary_slip...
    filename = Column(String)
    storage_path = Column(String)
    
    ocr_status = Column(String, default="pending")  # pending|processing|complete|failed
    extraction_confidence = Column(Float, nullable=True)  # 0.0-1.0 aggregate
    extracted_json = Column(Text, nullable=True)  # Store robust JSON dump text
    
    financial_year = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")


class FinancialProfile(Base):
    """Aggregate tally of all confirmed documents for a specific user and FY."""
    __tablename__ = "financial_profiles"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    financial_year = Column(String)
    
    total_income = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_tds = Column(Float, default=0.0)
    
    calculated_old_tax = Column(Float, default=0.0)
    calculated_new_tax = Column(Float, default=0.0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="financial_profiles")
