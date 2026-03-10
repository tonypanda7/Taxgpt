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

import google.generativeai as genai
from PIL import Image

from security.pii_masker import mask_pii
from ai.extractor import extract_form16, extract_ais, extract_salary_slip, extract_rent_receipt

# Configure Gemini for image OCR
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    vision_model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or image files.
    
    PDFs  → PyMuPDF (fitz) for direct text extraction.
    Images → Gemini 1.5 Flash vision API for OCR.
    """
    ext = file_path.rsplit(".", 1)[-1].lower()
    
    if ext == "pdf":
        import fitz  # PyMuPDF
        text_parts = []
        with fitz.open(file_path) as pdf:
            for page in pdf:
                text_parts.append(page.get_text())
        raw = "\n".join(text_parts).strip()
        
        # If PDF is scanned (no selectable text), fall back to Gemini vision
        if len(raw) < 50 and GEMINI_API_KEY:
            with fitz.open(file_path) as pdf:
                page = pdf[0]
                pix = page.get_pixmap(dpi=200)
                img_path = file_path + ".tmp.png"
                pix.save(img_path)
            try:
                raw = _ocr_with_gemini(img_path)
            finally:
                if os.path.exists(img_path):
                    os.remove(img_path)
        return raw if raw else "Unable to extract text from this PDF."
    
    elif ext in ("jpg", "jpeg", "png"):
        if GEMINI_API_KEY:
            return _ocr_with_gemini(file_path)
        return "Gemini API key not configured — cannot OCR image."
    
    return "Unsupported file format."


def _ocr_with_gemini(image_path: str) -> str:
    """Use Gemini 1.5 Flash to OCR text from an image."""
    image = Image.open(image_path)
    prompt = (
        "Extract ALL visible text from this document image. "
        "Return only the raw text content, preserving the layout as much as possible. "
        "Do not add any commentary or formatting — just the text."
    )
    response = vision_model.generate_content([prompt, image])
    return response.text.strip()


def process_document_ocr(doc_id: str, db: Session):
    """Background task to extract text, mask PII, and run Gemini OCR."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return
        
    try:
        doc.ocr_status = "processing"
        db.commit()
        
        # 1. Extract text from uploaded file (PDF or image)
        raw_text = _extract_text_from_file(doc.storage_path)
        print(f"[OCR] Raw text length: {len(raw_text)} chars for doc {doc_id}")
        
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
        
        print(f"[OCR] Gemini returned {len(extracted_data)} fields for doc {doc_id}")
            
        # 4. Calculate Aggregate Confidence
        total_conf = 0.0
        count = 0
        for key, val in extracted_data.items():
            if isinstance(val, dict) and "confidence" in val:
                total_conf += val["confidence"]
                count += 1
                
        confidence = round(total_conf / count, 2) if count > 0 else 0.0
        
        # 5. Save results — include raw_text so frontend can display a summary
        save_data = {"_raw_text": masked_text, **extracted_data}
        doc.extracted_json = json.dumps(save_data)
        doc.extraction_confidence = confidence
        doc.ocr_status = "complete"
        db.commit()
        
    except Exception as e:
        print(f"Error in OCR task: {e}")
        import traceback
        traceback.print_exc()
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
        
    all_data = json.loads(doc.extracted_json) if doc.extracted_json else {}
    
    # Separate raw_text from structured fields
    raw_text = all_data.pop("_raw_text", None)
    extracted = all_data if all_data else None
    
    color = None
    if doc.extraction_confidence is not None:
        color = get_confidence_color(doc.extraction_confidence)
        
    return DocumentExtractionResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        ocr_status=doc.ocr_status,
        extraction_confidence=doc.extraction_confidence,
        confidence_color=color,
        extracted_data=extracted,
        raw_text=raw_text
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
            financial_year=doc.financial_year,
            total_income=0.0,
            total_deductions=0.0,
            total_tds=0.0
        )
        db.add(profile)
        
    # Ensure they aren't None from an old DB row
    profile.total_income = profile.total_income or 0.0
    profile.total_deductions = profile.total_deductions or 0.0
    profile.total_tds = profile.total_tds or 0.0
        
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
