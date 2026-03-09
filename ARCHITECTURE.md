# AI Tax Copilot: Architecture & Component Overview

## What is this project?

The **AI Tax Copilot** is a backend system designed to automate the process of understanding an Indian taxpayer's financial situation. 

Instead of requiring users to manually calculate their income and deductions from various documents, the system allows them to securely upload their tax documents (like Form 16s, AIS, salary slips). The system then uses AI to extract the relevant financial data, aggregates it into a financial profile, and uses a deterministic, rule-based tax engine to calculate their final tax liability under both the Old and New Indian tax regimes.

**The Golden Rule:** AI models (LLMs) are notorious for hallucinating math. Therefore, this project strictly separates *data extraction* (done by AI) from *tax calculation* (done by standard Python code). The LLM is **never** allowed to calculate tax figures.

---

## Role of Each Component

The project is structured into distinct modules to maintain separation of concerns and enforce security.

### 1. `api/` (The Application Gateway)
This directory contains the FastAPI routing logic. It handles receiving HTTP requests, validating the payload structures, and directing the flow of information.
*   **`api/documents.py`**: Manages the uploading of files, polling for OCR status, and the final confirmation step where extracted data is committed to the database.

### 2. `ai/` (The Intelligence Layer)
This folder manages all interactions with Large Language Models (LLMs).
*   **`ai/extractor.py`**: Uses **Google Gemini 1.5 Flash** to perform Optical Character Recognition (OCR) and structured data extraction from financial documents. It uses specific prompts to ensure Gemini returns strict JSON matching expected fields (e.g., `gross_salary`, `tds_deducted`).

### 3. `tax_engine/` (The Deterministic Calculator)
This module contains pure, deterministic Python code that implements Indian tax law for FY 2024-25.
*   **`tax_engine/individual_tax.py`**: Core slab calculator supporting both Old and New regime slabs, surcharge, Section 87A rebate, and 4% Health & Education Cess. Returns a rich breakdown dict.
*   **`tax_engine/regime_compare.py`**: Compares Old vs New regime by applying standard deductions (₹50K old / ₹75K new), computing full breakdowns, and returning a recommendation with savings amount.
*   **`tax_engine/worker_tax.py`**: Handles freelancer/gig worker taxation under Section 44ADA presumptive scheme (50% of gross receipts).
*   **`tax_engine/business_tax.py`**: Computes tax on business profits (revenue minus expenses).

### 4. `security/` (Data Protection)
Handles the protection of Personally Identifiable Information (PII).
*   **`security/pii_masker.py`**: Utilizes **Microsoft Presidio**. Before any document text is sent to the AI Layer (`extractor.py`), this script detects and masks sensitive data like PAN numbers, Aadhaar numbers, Phone Numbers, and Email Addresses.

### 5. `db/` (The Database & ORM)
Manages persistent storage using SQLite (for MVP) and SQLAlchemy ORM.
*   **`db/models.py`**: Defines the database schemas:
    *   `User`: Standard account information.
    *   `Document`: Represents an uploaded file, its status, and the raw JSON extracted by the AI.
    *   `FinancialProfile`: The central hub. When a user confirms a document, specific numbers are extracted and aggregated into this profile (e.g., summing up total income). This profile is what the tax engine reads to calculate liability.
*   **`alembic/`**: Contains the migration scripts used to update the database schema over time.

### 6. `schemas/` (Data Contracts)
*   **`schemas/documents.py`**: Defines Pydantic v2 models for document upload, extraction, and confirmation flows.
*   **`schemas/tax.py`**: Defines `RegimeBreakdown`, `DeductionOpportunity`, and `RegimeComparisonResponse` models for the tax comparison endpoint.

### 7. `scripts/` (Utilities)
*   **`scripts/suggest_deductions.py`**: Deterministic deduction opportunity engine. Checks unclaimed tax-saving sections (80C, 80D, NPS, 80TTA) against FY 2024-25 limits and estimates potential savings.

### 8. Core Lifecycle Example

1.  **Upload**: User uploads `form_16.pdf`. `api/documents.py` saves it.
2.  **Mask**: `security/pii_masker.py` strips the PAN number from the text.
3.  **Extract**: `ai/extractor.py` sends the masked text to Gemini, which returns `{"gross_salary": 1500000, "confidence": 0.95}`.
4.  **Confirm**: User validates the number. `api/documents.py` adds ₹15,00,000 to the user's `FinancialProfile.total_income` in the database.
5.  **Calculate**: The `tax_engine/` recalculates the tax based on the new total and updates the `FinancialProfile`.
6.  **Compare**: User hits `GET /tax/comparison`. The engine compares Old vs New regime, returns a full breakdown with the recommended regime, savings amount, breakeven investment, and deduction opportunities.
