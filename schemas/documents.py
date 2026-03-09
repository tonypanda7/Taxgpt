from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class DocTypeEnum(str, Enum):
    form16 = "form16"
    ais = "ais"
    # Starting with 26as lowercase as per DB schema
    form_26as = "26as"
    salary_slip = "salary_slip"
    rent_receipt = "rent_receipt"
    investment_proof = "investment_proof"
    bank_statement = "bank_statement"


class OcrStatusEnum(str, Enum):
    pending = "pending"
    processing = "processing"
    complete = "complete"
    failed = "failed"


class DocumentUploadResponse(BaseModel):
    id: UUID4
    filename: str
    doc_type: DocTypeEnum
    ocr_status: OcrStatusEnum
    message: str


class DocumentStatusResponse(BaseModel):
    id: UUID4
    ocr_status: OcrStatusEnum
    extraction_confidence: Optional[float] = Field(default=None, description="0.0 to 1.0 confidence score")
    
    
class ExtractedField(BaseModel):
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)


class DocumentExtractionResponse(BaseModel):
    id: UUID4
    doc_type: DocTypeEnum
    ocr_status: OcrStatusEnum
    extraction_confidence: Optional[float] = None
    confidence_color: Optional[str] = Field(
        default=None, 
        description="green (>=0.85), amber (0.60-0.84), red (<0.60)"
    )
    extracted_data: Optional[Dict[str, ExtractedField]] = None


class DocumentConfirmRequest(BaseModel):
    # The client sends back the final corrected dictionary of values
    confirmed_data: Dict[str, Any]


class DocumentConfirmResponse(BaseModel):
    message: str
    tax_recalculated: bool
    new_tax_liability: Optional[float] = None


class DocumentCorrectRequest(BaseModel):
    field_name: str
    corrected_value: Any


class MismatchResponse(BaseModel):
    form16_tds: float
    ais_tds: float
    difference: float
    likely_cause: str
    recommended_action: str
    flagged: bool
