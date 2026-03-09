---
trigger: always_on
---

# AI Tax Copilot — Project Rules

## Stack
- Backend: Python FastAPI
- Database: SQLite (MVP) → PostgreSQL migration path via SQLAlchemy ORM + Alembic
- AI — Document Extraction: Gemini 1.5 Flash (gemini-1.5-flash-latest)
- AI — Response Generation: GPT-4o-mini
- RAG: FAISS local vector store (MVP)
- Auth: JWT (RS256), bcrypt password hashing

## Project Status
- tax_engine.py: COMPLETE. Do not modify tax calculation logic without team discussion.
- Chatbot (api/chat.py + ai/extractor.py + ai/responder.py): IN PROGRESS.
- Document auto-parser: NOT STARTED. This is the active feature.

## Architecture — Golden Rule (NEVER violate)
The AI layer (Gemini/GPT) NEVER produces tax figures.
All rupee amounts in any API response MUST be sourced from engine/tax_engine.py.
ai/validator.py must run post-generation on every /chat response before it is returned.

## Folder Structure
taxcopilot-backend/
├── api/           # FastAPI route handlers only — zero business logic here
├── engine/        # Tax engine — deterministic Python, no AI
├── ai/            # All LLM calls (extractor.py, responder.py, rag.py, validator.py)
├── security/      # PII masking (Presidio), JWT, rate limiting
├── schemas/       # Pydantic v2 models only — no raw dicts in route handlers
├── db/            # SQLAlchemy ORM models + Alembic migrations
└── tests/         # pytest — engine tests must cover all slab boundaries

## Code Standards
- All DB operations via SQLAlchemy ORM. No raw SQL strings in application code.
- All API request/response bodies must be Pydantic v2 models.
- PII masking via Presidio runs BEFORE any content reaches Gemini or GPT.
- Every new endpoint needs a rate limit defined in security/rate_limiter.py.
- Log with structlog. Never expose stack traces to API clients.
- Engine version stored in every tax_calculations row (engine.MODULE_VERSION).

## Document Types Supported
form16, ais, 26as, salary_slip, rent_receipt, investment_proof, bank_statement

## PII That Must Never Reach the LLM
PAN, Aadhaar, bank account numbers, IFSC codes, phone numbers, email addresses.
These are masked by security/pii_masker.py before Layer 3 (entity extraction).

## Indian Tax Context
Financial Year: FY 2024-25
Currency: Indian Rupee (₹). Use Indian numbering: ₹10,00,000 not ₹1,000,000.
Tax regimes: old and new. Both always calculated. Engine handles both.