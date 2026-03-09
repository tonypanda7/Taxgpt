from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class ChatRequest(BaseModel):
    user_id: str
    message: str
    financial_year: str = "FY2024-25"

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
    validation_status: str = "success"
