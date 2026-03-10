"""Pydantic v2 models for the /chat endpoint."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    """Incoming chat message from the user."""
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = Field(
        default=None,
        description="Session ID to continue an existing conversation. "
                    "Omit or set to null to start a new session."
    )
    financial_year: str = Field(
        default="FY2024-25",
        description="Financial year context for tax queries."
    )


class ChatSource(BaseModel):
    """A single RAG source chunk used to answer the question."""
    text: str = Field(..., description="Snippet from the knowledge base chunk.")
    url: Optional[str] = Field(default=None, description="Source URL if available.")


class ChatResponse(BaseModel):
    """Response from the chatbot."""
    session_id: str
    reply: str = Field(..., description="AI-generated answer.")
    intent: str = Field(..., description="Detected intent: tax_calculation or tax_question.")
    sources: List[ChatSource] = Field(
        default_factory=list,
        description="RAG knowledge base sources used."
    )
    engine_output: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Tax engine results (only present for tax_calculation intent)."
    )
    validation: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Validator result from ai/validator.py."
    )
