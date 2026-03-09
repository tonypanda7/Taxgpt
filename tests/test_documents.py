import os
import pytest
from fastapi.testclient import TestClient
from main import app
from db.database import Base, engine, SessionLocal
from db.models import User

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    user = User(id="testuser_123", email="test@example.com", hashed_password="pw")
    db.add(user)
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_upload_rejects_exe(setup_database):
    # Dummy non-image/pdf file
    files = {"file": ("malware.exe", b"fake binary content", "application/x-msdownload")}
    response = client.post("/documents/upload?doc_type=form16&financial_year=FY2024-25", files=files)
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_upload_accepts_pdf(setup_database):
    # Valid file content
    files = {"file": ("form16.pdf", b"mock pdf data", "application/pdf")}
    response = client.post("/documents/upload?doc_type=form16&financial_year=FY2024-25", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Upload successful, processing started."
    assert "id" in data
    
def test_mismatch_check(setup_database):
    # Just check route existence
    response = client.get("/documents/mismatch?financial_year=FY2024-25&user_id=testuser_123")
    assert response.status_code == 200
    
def test_get_status_not_found(setup_database):
    response = client.get("/documents/fake-uuid/status")
    assert response.status_code == 404
