from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import FinancialProfile, User
from schemas.tax import (
    RegimeComparisonResponse, RegimeBreakdown, DeductionOpportunity,
    AdvanceTaxResponse, AdvanceTaxInstallment,
    HRAExemptionResponse
)
from schemas.chat import ChatRequest, ChatResponse, ValidationResult
from tax_engine.regime_compare import compare_regimes
from tax_engine.individual_tax import MODULE_VERSION, calculate_individual_tax, calculate_hra_exemption
from tax_engine.advance_tax import calculate_advance_tax
from scripts.suggest_deductions import suggest_deductions
from security.pii_masker import mask_pii
from ai.validator import validate_response, sanitize_response
from app.rag.query_kb import process_query

router = APIRouter(prefix="/tax", tags=["tax"])


def _format_inr(amount):
    """Format a number in Indian ₹ notation: ₹10,00,000 not ₹1,000,000."""
    if amount < 0:
        return f"-₹{_format_inr(abs(amount))[1:]}"
    
    s = str(int(round(amount)))
    if len(s) <= 3:
        return f"₹{s}"
    
    # Last 3 digits, then groups of 2
    last3 = s[-3:]
    rest = s[:-3]
    parts = []
    while rest:
        parts.append(rest[-2:])
        rest = rest[:-2]
    parts.reverse()
    return f"₹{','.join(parts)},{last3}"


def _compute_breakeven(income, current_deductions):
    """
    Calculate how much MORE the user needs to invest in 80C/NPS
    to make the old regime cheaper than new regime.
    Returns None if old regime is already recommended.
    """
    result = compare_regimes(income, current_deductions)
    
    if result["recommended_regime"] == "old":
        return None  # Already winning with old regime
    
    # Binary search: find minimum additional deduction to flip
    low, high = 0, 500000  # Max realistic additional deduction
    
    for _ in range(50):  # Enough iterations for precision
        mid = (low + high) / 2
        test = compare_regimes(income, current_deductions + mid)
        if test["recommended_regime"] == "old":
            high = mid
        else:
            low = mid
    
    breakeven = round(high, 0)
    
    # If breakeven is unreasonably high (> ₹5L additional), unlikely to be useful
    if breakeven > 500000:
        return None
    
    return breakeven


def _build_reason(recommended, savings, income):
    """Build a deterministic plain English reason string."""
    savings_str = _format_inr(savings)
    
    if recommended == "new":
        return (
            f"New regime saves you {savings_str} because your deductions are below "
            f"the breakeven threshold. Consider the new regime for simplicity."
        )
    else:
        return (
            f"Old regime saves you {savings_str} because your deductions are high enough "
            f"to offset the higher slab rates. Keep investing in 80C/NPS to maintain this advantage."
        )


@router.get("/comparison", response_model=RegimeComparisonResponse)
def get_regime_comparison(
    financial_year: str = "FY2024-25",
    db: Session = Depends(get_db)
):
    """
    Compare Old vs New tax regime for the user's current FinancialProfile.
    Returns full breakdown, recommendation, savings, and deduction opportunities.
    """
    
    # Use mock user for now (no JWT auth yet)
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=400, detail="No user found.")
    
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user.id,
        FinancialProfile.financial_year == financial_year
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"No FinancialProfile found for {financial_year}. Upload and confirm documents first."
        )
    
    # 1. Call tax engine
    result = compare_regimes(profile.total_income, profile.total_deductions)
    
    # 2. Build breakdowns
    old = result["old_regime"]
    new = result["new_regime"]
    
    old_breakdown = RegimeBreakdown(
        taxable_income=old["taxable_income"],
        deductions_applied=old["deductions_applied"],
        standard_deduction=old["standard_deduction"],
        base_tax=old["base_tax"],
        surcharge=old["surcharge"],
        rebate_87a=old["rebate_87a"],
        cess=old["cess"],
        total_tax=old["total_tax"],
        effective_rate=old["effective_rate"],
    )
    
    new_breakdown = RegimeBreakdown(
        taxable_income=new["taxable_income"],
        deductions_applied=new["deductions_applied"],
        standard_deduction=new["standard_deduction"],
        base_tax=new["base_tax"],
        surcharge=new["surcharge"],
        rebate_87a=new["rebate_87a"],
        cess=new["cess"],
        total_tax=new["total_tax"],
        effective_rate=new["effective_rate"],
    )
    
    # 3. Compute breakeven
    breakeven = _compute_breakeven(profile.total_income, profile.total_deductions)
    
    # 4. Build reason string
    reason = _build_reason(result["recommended_regime"], result["savings"], profile.total_income)
    
    # 5. Get deduction suggestions
    raw_suggestions = suggest_deductions(profile.total_deductions)
    deduction_opps = [
        DeductionOpportunity(**s) for s in raw_suggestions
    ]
    
    return RegimeComparisonResponse(
        old_regime=old_breakdown,
        new_regime=new_breakdown,
        recommended_regime=result["recommended_regime"],
        savings=result["savings"],
        reason=reason,
        breakeven_investment=breakeven,
        deduction_opportunities=deduction_opps,
        engine_version=MODULE_VERSION,
    )


@router.get("/advance-tax", response_model=AdvanceTaxResponse)
def get_advance_tax_schedule(
    financial_year: str = "FY2024-25",
    db: Session = Depends(get_db)
):
    """
    Calculate advance tax installment schedule for the current user.
    Shows quarterly installments and whether advance tax applies.
    """
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=400, detail="No user found.")

    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user.id,
        FinancialProfile.financial_year == financial_year
    ).first()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"No FinancialProfile found for {financial_year}. Upload documents first."
        )

    # Use tax engine to get total tax liability
    tax_result = calculate_individual_tax(max(profile.total_income - profile.total_deductions, 0))
    annual_tax = tax_result["total_tax"]

    result = calculate_advance_tax(annual_tax, tds_already_deducted=profile.total_tds)

    installments = [
        AdvanceTaxInstallment(**inst) for inst in result.get("installments", [])
    ]

    return AdvanceTaxResponse(
        advance_tax_applicable=result["advance_tax_applicable"],
        reason=result.get("reason"),
        annual_tax_liability=result.get("annual_tax_liability"),
        tds_already_deducted=result.get("tds_already_deducted", 0),
        net_tax_liability=result["net_tax_liability"],
        installments=installments,
        engine_version=MODULE_VERSION,
    )


@router.get("/hra", response_model=HRAExemptionResponse)
def calculate_hra(
    basic_salary: float,
    hra_received: float,
    rent_paid: float,
    is_metro: bool = True
):
    """
    Calculate HRA exemption under Section 10(13A) — applicable only under Old Regime.
    Shows the 3-part formula breakdown and the final exemption amount.
    """
    result = calculate_hra_exemption(basic_salary, hra_received, rent_paid, is_metro)
    return HRAExemptionResponse(**result)


@router.get("/chat/history")
def get_chat_history():
    """
    Mock endpoint to return chat history for the frontend.
    Normally this would fetch from the database based on the user JWT.
    """
    return [
        {
            "id": 1,
            "role": "assistant",
            "text": "Hi Rahul! I'm your AI Tax Copilot. I see your profile is set up as a Salaried Employee with ₹15L gross income. How can I help you save tax today?",
            "time": "10:00 AM",
        },
        {
            "id": 2,
            "role": "user",
            "text": "Should I claim HRA or buy a house on EMI to save more?",
            "time": "10:02 AM",
        },
        {
            "id": 3,
            "role": "assistant",
            "text": "That’s a great question. Since your rent is currently ₹20,000/month, your HRA exemption is limited to ₹1.2L annually.\n\nIf you buy a house on EMI (say, a ₹50L loan at 8.5%), you can claim up to ₹2L in interest deduction under Section 24B. This would reduce your total tax from ₹1.14L to ₹95,000.\n\nHowever, remember that home ownership comes with other costs. Want me to run a detailed comparison?",
            "time": "10:03 AM",
            "citations": [
                {
                    "section": "Section 24(b)", 
                    "text": "Deduction of up to ₹2,00,000 is allowed on interest paid for a self-occupied property loan.", 
                    "fy": "FY 2024-25", 
                    "link": "https://incometaxindia.gov.in/tutorials/10.%20income-from-house-property.pdf" 
                },
                { 
                    "section": "Section 10(13A)", 
                    "text": "HRA exemption is the least of: actual HRA, 50% basic (metro) or rent paid minus 10% basic salary.", 
                    "fy": "FY 2024-25", 
                    "link": "https://incometaxindia.gov.in/tutorials/4.%20salary%20income.pdf" 
                }
            ]
        }
    ]


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    """
    RAG-powered tax chatbot.
    Accepts a natural-language tax question, runs it through the RAG pipeline
    (ChromaDB + Ollama), and returns an AI-generated answer grounded in
    Indian tax law.  PII is masked before any LLM call, and the response is
    validated against the Golden Rule (no hallucinated rupee figures).
    """

    # 1. Mask PII before it reaches any LLM
    masked_query = mask_pii(payload.query)

    # 2. Run the RAG pipeline with user profile context
    result = process_query(masked_query, payload.user_profile)

    # 3. Determine the answer text for validation
    answer = result.get("answer", result)
    sources = result.get("sources") if isinstance(result, dict) else None

    # 4. Golden Rule validation on text answers
    validation = None
    if isinstance(answer, str):
        val_result = validate_response(answer, engine_output=payload.user_profile)
        validation = ValidationResult(
            is_valid=val_result["is_valid"],
            flagged_amounts=val_result["flagged_amounts"],
            warning=val_result.get("warning"),
        )
        # Append disclaimer if validation fails
        if not val_result["is_valid"]:
            answer = sanitize_response(answer, engine_output=None)

    return ChatResponse(
        question=payload.query,
        answer=answer,
        sources=sources,
        validation=validation,
    )
