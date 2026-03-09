from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.chat import ChatRequest, ChatResponse
from ai.responder import generate_chat_response
from ai.validator import validate_response_figures

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
def handle_chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    """Receives user query, queries GPT with context, and validates text safety."""
    
    # 1. Generate Response
    draft_response = generate_chat_response(
        message=payload.message,
        user_id=payload.user_id,
        financial_year=payload.financial_year,
        db=db
    )
    
    # 2. Golden Rule Enforcement
    is_safe = validate_response_figures(
        response_text=draft_response,
        user_id=payload.user_id,
        financial_year=payload.financial_year,
        db=db
    )
    
    if not is_safe:
        return ChatResponse(
            response="I'm sorry, my calculated figures did not match the tax engine verification step so I suppressed the response. Please check your financial profile.",
            validation_status="failed_blocked"
        )
        
    return ChatResponse(
        response=draft_response,
        validation_status="success_verified"
    )
