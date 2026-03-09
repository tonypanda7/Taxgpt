from pydantic import BaseModel, Field
from typing import Optional, List


class RegimeBreakdown(BaseModel):
    taxable_income: float = Field(description="Income after deductions and standard deduction")
    deductions_applied: float = Field(description="Total Chapter VIA deductions applied")
    standard_deduction: float = Field(description="Standard deduction amount (₹50K old / ₹75K new)")
    base_tax: float = Field(description="Tax calculated from slab rates before surcharge/rebate")
    surcharge: float = Field(default=0.0, description="Surcharge on base tax for high incomes")
    rebate_87a: float = Field(default=0.0, description="Section 87A rebate amount")
    cess: float = Field(description="4% Health & Education Cess")
    total_tax: float = Field(description="Final tax payable after surcharge, rebate, and cess")
    effective_rate: float = Field(description="Effective tax rate as percentage of gross income")


class DeductionOpportunity(BaseModel):
    section: str = Field(description="Tax section, e.g. '80C', '80D', 'NPS'")
    description: str
    max_limit: float
    current_claimed: float
    potential_saving: float = Field(description="Estimated tax saving if fully utilized")


class RegimeComparisonResponse(BaseModel):
    old_regime: RegimeBreakdown
    new_regime: RegimeBreakdown
    recommended_regime: str = Field(description="'old' or 'new'")
    savings: float = Field(description="Rupee difference between the two regimes")
    reason: str = Field(description="Plain English explanation of recommendation")
    breakeven_investment: Optional[float] = Field(
        default=None,
        description="Additional investment in 80C/NPS needed to flip recommendation (null if old is already better)"
    )
    deduction_opportunities: List[DeductionOpportunity] = Field(default_factory=list)
    engine_version: str = Field(description="Tax engine version used for this calculation")
