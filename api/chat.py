"""
Chat API — POST /chat

The main chatbot endpoint. Ties together:
- PII masking (security/pii_masker.py)
- RAG retrieval (ai/rag.py → ChromaDB)
- Intent detection + entity extraction (ai/responder.py → Ollama)
- Tax engine (tax_engine/ → deterministic)
- Response generation (ai/responder.py → Ollama qwen2.5)
- Post-generation validation (ai/validator.py)
- Conversation persistence (db/models.py → ChatMessage)
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User, FinancialProfile, ChatMessage
from schemas.chat import ChatRequest, ChatResponse, ChatSource

from security.pii_masker import mask_pii
from ai.rag import query_knowledge_base, build_context
from ai.responder import detect_intent, extract_financial_entities, run_tax_engine, generate_response
from ai.validator import validate_response, sanitize_response

router = APIRouter(prefix="/chat", tags=["chat"])


def _load_history(session_id: str, db: Session, limit: int = 10):
    """Load the last N messages for a session."""
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    # Return last `limit` messages
    history = [{"role": r.role, "content": r.content} for r in rows]
    return history[-limit:]


def _save_message(session_id: str, user_id: str, role: str, content: str, db: Session):
    """Persist a single chat message."""
    msg = ChatMessage(
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(msg)
    db.commit()


def _get_user_profile(user_id: str, financial_year: str, db: Session):
    """Load the user's financial profile if available."""
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id,
        FinancialProfile.financial_year == financial_year
    ).first()

    if not profile:
        return None

    return {
        "total_income": profile.total_income,
        "total_deductions": profile.total_deductions,
        "total_tds": profile.total_tds,
    }


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chatbot endpoint.

    Flow:
    1. Resolve session + user
    2. Mask PII
    3. Query RAG (ChromaDB)
    4. Detect intent (Ollama)
    5. If tax_calculation → extract entities → run engine
    6. Generate response (Ollama + RAG context + engine output)
    7. Validate response (ai/validator.py)
    8. Persist messages
    9. Return ChatResponse
    """

    # --- 1. Session + User ---
    session_id = payload.session_id or str(uuid.uuid4())

    # Mock user for now (no JWT auth yet)
    user = db.query(User).first()
    if not user:
        user = User(email="test@example.com", hashed_password="mock")
        db.add(user)
        db.commit()
        db.refresh(user)

    # --- 2. Mask PII ---
    masked_message = mask_pii(payload.message)

    # --- 3. RAG ---
    try:
        documents, source_metas = query_knowledge_base(masked_message)
        context = build_context(documents)
    except Exception:
        # KB might not be built yet — proceed without context
        documents, source_metas = [], []
        context = ""

    # --- 4. Intent Detection ---
    intent = detect_intent(masked_message)

    # --- 5. Tax Calculation (if applicable) ---
    engine_output = None
    if intent == "tax_calculation":
        entities = extract_financial_entities(masked_message, context)
        if entities:
            engine_output = run_tax_engine(entities)

    # --- 6. Load history + user profile ---
    conversation_history = _load_history(session_id, db)
    user_profile = _get_user_profile(user.id, payload.financial_year, db)

    # --- 7. Generate response ---
    raw_reply = generate_response(
        question=masked_message,
        context=context,
        conversation_history=conversation_history,
        engine_output=engine_output,
        user_profile=user_profile,
    )

    # --- 8. Validate ---
    validation_result = validate_response(raw_reply, engine_output)
    final_reply = sanitize_response(raw_reply, engine_output) if engine_output else raw_reply

    # --- 9. Persist ---
    _save_message(session_id, user.id, "user", payload.message, db)
    _save_message(session_id, user.id, "assistant", final_reply, db)

    # --- 10. Build sources ---
    sources = []
    for doc, meta in zip(documents[:5], source_metas[:5]):
        sources.append(ChatSource(
            text=doc[:300],  # Truncate for response size
            url=meta.get("url") if meta else None
        ))

    return ChatResponse(
        session_id=session_id,
        reply=final_reply,
        intent=intent,
        sources=sources,
        engine_output=engine_output,
        validation=validation_result,
    )
