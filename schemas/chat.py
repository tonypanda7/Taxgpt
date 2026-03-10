from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List


class ChatRequest(BaseModel):
    query: str = Field(
        description="User's tax-related question in natural language",
        min_length=1,
        max_length=2000,
    )


class ValidationResult(BaseModel):
    is_valid: bool = Field(description="True if no unauthorized figures found")
    flagged_amounts: List[float] = Field(default_factory=list)
    warning: Optional[str] = None


class ChatResponse(BaseModel):
    question: str = Field(description="Original query echoed back")
    answer: Any = Field(description="AI-generated answer text or structured tax result")
    sources: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="RAG source documents used to generate the answer"
    )
    validation: Optional[ValidationResult] = Field(
        default=None,
        description="Golden Rule validation result for the AI response"
    )
