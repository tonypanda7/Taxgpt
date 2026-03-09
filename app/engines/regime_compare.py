from app.engines.individual_tax import (
    calculate_individual_tax,
    STANDARD_DEDUCTION_OLD,
    STANDARD_DEDUCTION_NEW,
    MODULE_VERSION
)


def compare_regimes(income, deductions):
    """
    Compare Old vs New tax regime for FY 2024-25.
    
    Args:
        income: Gross total income (before any deductions)
        deductions: Total deductions claimed (80C, 80D, NPS, HRA, etc.)
    
    Returns:
        Rich dict with full breakdown for both regimes, recommendation, and savings.
    """
    
    # --- Old Regime ---
    # Standard deduction (salaried) + explicit deductions apply
    old_standard = STANDARD_DEDUCTION_OLD
    old_taxable = max(income - old_standard - deductions, 0)
    old_result = calculate_individual_tax(old_taxable, regime="old")

    old_effective_rate = round((old_result["total_tax"] / income) * 100, 2) if income > 0 else 0.0

    # --- New Regime ---
    # Only standard deduction applies, no Chapter VIA deductions
    new_standard = STANDARD_DEDUCTION_NEW
    new_taxable = max(income - new_standard, 0)
    new_result = calculate_individual_tax(new_taxable, regime="new")

    new_effective_rate = round((new_result["total_tax"] / income) * 100, 2) if income > 0 else 0.0

    # --- Recommendation ---
    old_tax = old_result["total_tax"]
    new_tax = new_result["total_tax"]
    savings = round(abs(old_tax - new_tax), 2)

    if old_tax <= new_tax:
        recommended = "old"
    else:
        recommended = "new"

    return {
        "old_regime": {
            "taxable_income": old_taxable,
            "standard_deduction": old_standard,
            "deductions_applied": deductions,
            "base_tax": old_result["base_tax"],
            "surcharge": old_result["surcharge"],
            "rebate_87a": old_result["rebate_87a"],
            "cess": old_result["cess"],
            "total_tax": old_tax,
            "effective_rate": old_effective_rate
        },
        "new_regime": {
            "taxable_income": new_taxable,
            "standard_deduction": new_standard,
            "deductions_applied": 0,
            "base_tax": new_result["base_tax"],
            "surcharge": new_result["surcharge"],
            "rebate_87a": new_result["rebate_87a"],
            "cess": new_result["cess"],
            "total_tax": new_tax,
            "effective_rate": new_effective_rate
        },
        "recommended_regime": recommended,
        "savings": savings,
        "old_regime_tax": old_tax,    # Backward compat
        "new_regime_tax": new_tax,    # Backward compat
        "engine_version": MODULE_VERSION
    }
