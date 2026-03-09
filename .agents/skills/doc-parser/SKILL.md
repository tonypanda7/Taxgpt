---
name: document-auto-parser
description: Building the document upload, OCR extraction, and financial data parsing feature for AI Tax Copilot. Use this skill when working on documents.py, ai/extractor.py, or anything related to Form 16, AIS, OCR, or file uploads.
---

# Document Auto-Parser Feature Spec

## What This Feature Does
Users upload financial documents (Form 16, AIS, salary slips, etc.).
Gemini 1.5 Flash extracts structured financial data from them.
The user confirms extracted fields, which then flows into financial_profiles and triggers tax recalculation.

## Files to Create / Modify
- api/documents.py         — FastAPI routes for upload, status, confirm, correct
- ai/extractor.py          — Gemini extraction logic (may already exist partially for chat)
- db/models.py             — documents table (add if not present)
- schemas/documents.py     — Pydantic request/response models
- security/pii_masker.py   — ensure it handles PDF text layers too
- tests/test_documents.py  — OCR extraction tests with fixture documents

## API Endpoints to Implement
POST   /documents/upload              — multipart, max 10MB, triggers async OCR
GET    /documents/{id}/status         — polling: pending | processing | complete | failed
GET    /documents/{id}/extraction     — returns extracted JSON + confidence scores
POST   /documents/{id}/confirm        — user confirms fields → profile update → tax recalc
POST   /documents/{id}/correct        — user fixes a specific field
DELETE /documents/{id}                — purge file + extracted data
GET    /documents/mismatch            — Form 16 vs AIS TDS discrepancy check

## Processing Pipeline (in order)
1. Receive file via multipart
2. Magic-byte virus check (reject .exe disguised as .pdf)
3. Store to UPLOAD_DIR/{user_id}/{uuid}.{ext}
4. Run Presidio PII masking on any text layer
5. Send to Gemini 1.5 Flash with doc-type-specific prompt (see prompts below)
6. Parse confidence per field from Gemini JSON response
7. Store in documents.extracted_json, set ocr_status = 'complete'
8. Return to client via polling

## Gemini Extraction Prompts by Doc Type

### Form 16
Extract: employer_name, pan (MASK THIS - replace with token), gross_salary,
standard_deduction, professional_tax, net_taxable_income, tds_deducted,
section_80c_total, section_80d_total, hra_exemption, financial_year.
Return JSON with value and confidence (0.0-1.0) per field.
If a field is unreadable, set value: null and confidence: 0.0.

### AIS (Annual Information Statement)
Extract: all income sources as array [{source_type, amount, tds_deducted}],
total_gross_income, total_tds, high_value_transactions as array.

### Salary Slip
Extract: month, year, basic_salary, hra, special_allowance,
gross_salary, professional_tax, tds_this_month, net_salary.

### Rent Receipt
Extract: landlord_name, rent_amount, period_from, period_to,
property_address (city only for metro/non-metro classification).

## Database Schema — documents table
id: UUID PK
user_id: UUID FK → users.id
doc_type: TEXT (form16|ais|26as|salary_slip|rent_receipt|investment_proof|bank_statement)
filename: TEXT
storage_path: TEXT
ocr_status: TEXT (pending|processing|complete|failed)
extraction_confidence: REAL (0.0–1.0 aggregate)
extracted_json: TEXT (JSON)
financial_year: TEXT
uploaded_at: DATETIME

## Confidence Thresholds
>= 0.85 → green (auto-accept safe, but still show user)
0.60–0.84 → amber (flag for user review)
< 0.60 → red (require manual entry)

## Form 16 vs AIS Mismatch Logic
Compare documents.extracted_json[tds_deducted] across form16 and ais docs
for the same user + financial_year. If difference > ₹100, flag it.
Return: { form16_tds, ais_tds, difference, likely_cause, recommended_action }
```

---

## Step 3 — The Prompt to Give Antigravity

Use **Planning Mode** (not Fast). Paste this as your task:
```
I'm adding the document auto-parser feature to our AI Tax Copilot backend.

Read the project rules and the document-auto-parser skill before starting.

The tax engine is already complete in engine/tax_engine.py.
The chatbot is in progress in api/chat.py and ai/extractor.py.
Do not modify any existing tax engine code.

Build the following in this exact order:

1. schemas/documents.py — Pydantic v2 models for all document endpoints
2. db/models.py — add the documents table (SQLAlchemy ORM, match existing model patterns)
3. Generate and run an Alembic migration for the new table
4. ai/extractor.py — add Gemini 1.5 Flash extraction functions for each doc type
   (form16, ais, salary_slip, rent_receipt). Use GEMINI_API_KEY from env.
   Each function returns {field_name: {value, confidence}} JSON.
5. api/documents.py — all 7 endpoints from the skill spec.
   Upload endpoint uses FastAPI BackgroundTasks for async OCR processing.
   Confirm endpoint calls engine/tax_engine.py after updating the profile.
6. tests/test_documents.py — at minimum: test upload rejects non-PDF/image,
   test extraction parses fixture Form 16 JSON correctly,
   test confirm triggers profile update.

Use the documents table schema from the skill.
Apply Presidio PII masking before any content reaches Gemini (security/pii_masker.py already exists).
Confidence thresholds: ≥0.85 green, 0.60–0.84 amber, <0.60 red.
Return confidence color codes in the extraction endpoint response.