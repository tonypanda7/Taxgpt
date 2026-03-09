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


# --- Advance Tax Schemas ---

class AdvanceTaxInstallment(BaseModel):
    due_date: str = Field(description="ISO date of installment deadline")
    display_date: str = Field(description="Human-readable date")
    installment_percent: int = Field(description="Percent of tax due this quarter")
    cumulative_percent: int = Field(description="Cumulative % due up to this quarter")
    installment_amount: float = Field(description="Amount due this quarter")
    cumulative_amount: float = Field(description="Total cumulative amount due")


class AdvanceTaxResponse(BaseModel):
    advance_tax_applicable: bool = Field(description="True if net tax > ₹10,000")
    reason: Optional[str] = Field(default=None, description="Why advance tax doesn't apply")
    annual_tax_liability: Optional[float] = None
    tds_already_deducted: float = 0
    net_tax_liability: float
    installments: List[AdvanceTaxInstallment] = Field(default_factory=list)
    engine_version: str


# --- HRA Schemas ---

class HRAExemptionResponse(BaseModel):
    actual_hra: float = Field(description="Actual HRA received from employer")
    percent_of_basic: float = Field(description="50% (metro) or 40% (non-metro) of basic salary")
    rent_minus_10_percent: float = Field(description="Rent paid minus 10% of basic salary")
    exemption: float = Field(description="HRA exemption = minimum of the three legs")
    metro_city: bool = Field(description="Whether metro city rates were used")
    engine_version: str

