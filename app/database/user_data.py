from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine("sqlite:///user_data.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class UserFinancialData(Base):
    __tablename__ = "user_financial_data"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    document_type = Column(String)
    data = Column(JSON)

Base.metadata.create_all(bind=engine)