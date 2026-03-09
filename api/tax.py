from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import FinancialProfile, User
from schemas.tax import RegimeComparisonResponse, RegimeBreakdown, DeductionOpportunity
from tax_engine.regime_compare import compare_regimes
from tax_engine.individual_tax import MODULE_VERSION
from scripts.suggest_deductions import suggest_deductions

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
