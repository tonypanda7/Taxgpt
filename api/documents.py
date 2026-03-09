import uuid
import os
import io
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from db.models import Document, User
from schemas.documents import (
    DocTypeEnum, OcrStatusEnum, DocumentUploadResponse, 
    DocumentStatusResponse, DocumentExtractionResponse,
    DocumentConfirmRequest, DocumentConfirmResponse,
    DocumentCorrectRequest, MismatchResponse
)

from security.pii_masker import mask_pii
from ai.extractor import extract_form16, extract_ais, extract_salary_slip, extract_rent_receipt
# We import a dummy tax engine trigger (in production it would be from tax_engine.individual_tax etc)
# from engine.tax_engine import recalculate_tax_for_user

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def process_document_ocr(doc_id: str, db: Session):
    """Background task to extract text, mask PII, and run Gemini OCR."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return
        
    try:
        doc.ocr_status = "processing"
        db.commit()
        
        # 1. Read file to extract text (In real life, we would use pdfminer or pytesseract here)
        # For this implementation, we will mock the text extraction from the file.
        # Let's pretend we extracted text from PDF/Image:
        raw_text = "MOCK EXTRACTED TEXT FROM PDF"
        with open(doc.storage_path, "rb") as f:
            # We would normally parse the file here
            pass 
        
        # 2. Mask PII
        masked_text = mask_pii(raw_text)
        
        # 3. Send to Gemini based on type
        extracted_data = {}
        if doc.doc_type == DocTypeEnum.form16.value:
            extracted_data = extract_form16(masked_text)
        elif doc.doc_type == DocTypeEnum.ais.value:
            extracted_data = extract_ais(masked_text)
        elif doc.doc_type == DocTypeEnum.salary_slip.value:
            extracted_data = extract_salary_slip(masked_text)
        elif doc.doc_type == DocTypeEnum.rent_receipt.value:
            extracted_data = extract_rent_receipt(masked_text)
            
        # 4. Calculate Aggregate Confidence
        total_conf = 0.0
        count = 0
        for key, val in extracted_data.items():
            if isinstance(val, dict) and "confidence" in val:
                total_conf += val["confidence"]
                count += 1
                
        confidence = round(total_conf / count, 2) if count > 0 else 0.0
        
        # 5. Save results
        doc.extracted_json = json.dumps(extracted_data)
        doc.extraction_confidence = confidence
        doc.ocr_status = "complete"
        db.commit()
        
    except Exception as e:
        print(f"Error in OCR task: {e}")
        doc.ocr_status = "failed"
        db.commit()


def get_confidence_color(confidence: float) -> str:
    if confidence >= 0.85:
        return "green"
    elif confidence >= 0.60:
        return "amber"
    return "red"


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    doc_type: DocTypeEnum,
    financial_year: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a document and triggers async OCR processing."""
    
    # 2. Magic-byte virus check (simplified for now to ext check)
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["pdf", "jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Images allowed.")
    
    # Check max size (FastAPI SpooledTemporaryFile handles this, but we can check bytes)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
    
    # Setup user (mock user id for now)
    user = db.query(User).first()
    if not user:
        user = User(email="test@example.com", hashed_password="mock")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 3. Store file
    doc_id = str(uuid.uuid4())
    user_dir = os.path.join(UPLOAD_DIR, user.id)
    os.makedirs(user_dir, exist_ok=True)
    
    storage_path = os.path.join(user_dir, f"{doc_id}.{ext}")
    with open(storage_path, "wb") as f:
        f.write(file_bytes)
        
    # Save to DB
    doc = Document(
        id=doc_id,
        user_id=user.id,
        doc_type=doc_type.value,
        filename=file.filename,
        storage_path=storage_path,
        financial_year=financial_year,
        ocr_status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Trigger Async Processing (Step 4,5,6,7)
    background_tasks.add_task(process_document_ocr, doc.id, db)
    
    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.filename,
        doc_type=doc_type,
        ocr_status=OcrStatusEnum.pending,
        message="Upload successful, processing started."
    )


@router.get("/{id}/status", response_model=DocumentStatusResponse)
def get_document_status(id: str, db: Session = Depends(get_db)):
    """Polling endpoint to check OCR status."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return DocumentStatusResponse(
        id=doc.id,
        ocr_status=doc.ocr_status,
        extraction_confidence=doc.extraction_confidence
    )


@router.get("/{id}/extraction", response_model=DocumentExtractionResponse)
def get_document_extraction(id: str, db: Session = Depends(get_db)):
    """Returns the extracted JSON and confidence scores."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    extracted = json.loads(doc.extracted_json) if doc.extracted_json else None
    
    color = None
    if doc.extraction_confidence is not None:
        color = get_confidence_color(doc.extraction_confidence)
        
    return DocumentExtractionResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        ocr_status=doc.ocr_status,
        extraction_confidence=doc.extraction_confidence,
        confidence_color=color,
        extracted_data=extracted
    )


from db.models import FinancialProfile
from tax_engine.regime_compare import compare_regimes

@router.post("/{id}/confirm", response_model=DocumentConfirmResponse)
def confirm_document(id: str, payload: DocumentConfirmRequest, db: Session = Depends(get_db)):
    """User confirms fields → profile update → tax recalc."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Overwrite the DB JSON with confirmed data
    doc.extracted_json = json.dumps(payload.confirmed_data)
    db.commit()
    
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == doc.user_id,
        FinancialProfile.financial_year == doc.financial_year
    ).first()
    
    if not profile:
        profile = FinancialProfile(
            user_id=doc.user_id,
            financial_year=doc.financial_year
        )
        db.add(profile)
        
    if doc.doc_type == DocTypeEnum.form16.value:
        profile.total_income += float(payload.confirmed_data.get('gross_salary', {}).get('value') or 0.0)
        profile.total_deductions += float(payload.confirmed_data.get('section_80c_total', {}).get('value') or 0.0)
        profile.total_tds += float(payload.confirmed_data.get('tds_deducted', {}).get('value') or 0.0)
    elif doc.doc_type == DocTypeEnum.ais.value:
        profile.total_income += float(payload.confirmed_data.get('total_gross_income', {}).get('value') or 0.0)
        profile.total_tds += float(payload.confirmed_data.get('total_tds', {}).get('value') or 0.0)
        
    tax_comparison = compare_regimes(profile.total_income, profile.total_deductions)
    
    profile.calculated_old_tax = tax_comparison["old_regime_tax"]
    profile.calculated_new_tax = tax_comparison["new_regime_tax"]
    db.commit()
    
    # Return the minimum of the two as the new liability
    new_liability = min(profile.calculated_old_tax, profile.calculated_new_tax)
    
    return DocumentConfirmResponse(
        message="Document confirmed and financial profile updated.",
        tax_recalculated=True,
        new_tax_liability=new_liability
    )


@router.post("/{id}/correct")
def correct_single_field(id: str, payload: DocumentCorrectRequest, db: Session = Depends(get_db)):
    """User fixes a specific field."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    data = json.loads(doc.extracted_json) if doc.extracted_json else {}
    data[payload.field_name] = {"value": payload.corrected_value, "confidence": 1.0, "corrected_by": "user"}
    
    doc.extracted_json = json.dumps(data)
    db.commit()
    return {"message": f"Updated {payload.field_name}"}


@router.delete("/{id}")
def delete_document(id: str, db: Session = Depends(get_db)):
    """Purge file and extracted data."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


@router.get("/mismatch", response_model=MismatchResponse)
def check_tds_mismatch(financial_year: str, user_id: str, db: Session = Depends(get_db)):
    """Form 16 vs AIS TDS discrepancy check."""
    docs = db.query(Document).filter(
        Document.user_id == user_id, 
        Document.financial_year == financial_year,
        Document.ocr_status == "complete"
    ).all()
    
    form16_tds = 0.0
    ais_tds = 0.0
    
    for doc in docs:
        if not doc.extracted_json:
            continue
        data = json.loads(doc.extracted_json)
        
        if doc.doc_type == "form16":
            tds_val = data.get("tds_deducted", {})
            form16_tds += float(tds_val.get("value", 0.0) if isinstance(tds_val, dict) else 0.0)
            
        elif doc.doc_type == "ais":
            tds_val = data.get("total_tds", {})
            ais_tds += float(tds_val.get("value", 0.0) if isinstance(tds_val, dict) else 0.0)
            
    diff = abs(form16_tds - ais_tds)
    flagged = diff > 100
    
    return MismatchResponse(
        form16_tds=form16_tds,
        ais_tds=ais_tds,
        difference=diff,
        flagged=flagged,
        likely_cause="Mismatch in TDS reported by employer vs Income Tax Dept portal." if flagged else "No discrepancies.",
        recommended_action="Contact your employer to rectify TDS return if difference is large." if flagged else "Safe to proceed."
    )
