MODULE_VERSION = "1.0.0-FY2024-25"

# FY 2024-25 Tax Slabs
OLD_REGIME_SLABS = [
    (250000, 0),       # 0 – 2.5L
    (250000, 0.05),    # 2.5L – 5L
    (500000, 0.20),    # 5L – 10L
    (float("inf"), 0.30)  # 10L+
]

NEW_REGIME_SLABS = [
    (300000, 0),       # 0 – 3L
    (300000, 0.05),    # 3L – 6L (was 3-7, Budget 2024 revised)
    (300000, 0.10),    # 6L – 9L
    (300000, 0.15),    # 9L – 12L
    (300000, 0.20),    # 12L – 15L
    (float("inf"), 0.30)  # 15L+
]

STANDARD_DEDUCTION_OLD = 50000
STANDARD_DEDUCTION_NEW = 75000  # Budget 2024

# Surcharge rates on base tax (applied before cess)
SURCHARGE_SLABS = [
    (5000000, 0),          # Up to 50L — no surcharge
    (10000000, 0.10),      # 50L – 1Cr — 10%
    (20000000, 0.15),      # 1Cr – 2Cr — 15%
    (50000000, 0.25),      # 2Cr – 5Cr — 25%
    (float("inf"), 0.25)   # 5Cr+ — 25% (new regime cap). Old regime is 37%, handled below
]

# 87A rebate thresholds
REBATE_87A_OLD_LIMIT = 500000       # Old regime: taxable income <= 5L
REBATE_87A_OLD_MAX = 12500          # Max rebate under old regime
REBATE_87A_NEW_LIMIT = 700000       # New regime: taxable income <= 7L (full rebate)


def _apply_slabs(taxable_income, slabs):
    """Calculate base tax by applying slab rates to taxable income."""
    remaining = max(taxable_income, 0)
    tax = 0

    for slab_limit, rate in slabs:
        taxable = min(remaining, slab_limit)
        tax += taxable * rate
        remaining -= taxable
        if remaining <= 0:
            break

    return round(tax, 2)


def _apply_surcharge(base_tax, taxable_income, regime="new"):
    """Calculate surcharge on base tax based on taxable income."""
    if taxable_income <= 5000000:
        return 0.0

    # Determine rate
    if taxable_income <= 10000000:
        rate = 0.10
    elif taxable_income <= 20000000:
        rate = 0.15
    elif taxable_income <= 50000000:
        rate = 0.25
    else:
        rate = 0.25 if regime == "new" else 0.37  # New regime caps at 25%

    return round(base_tax * rate, 2)


def _apply_rebate_87a(base_tax, taxable_income, regime="new"):
    """Apply Section 87A rebate. Returns the rebate amount (to be subtracted)."""
    if regime == "new":
        if taxable_income <= REBATE_87A_NEW_LIMIT:
            return base_tax  # Full rebate — tax becomes zero
        return 0.0
    else:
        if taxable_income <= REBATE_87A_OLD_LIMIT:
            return min(base_tax, REBATE_87A_OLD_MAX)
        return 0.0


def calculate_individual_tax(income, regime="new"):
    """
    Calculate tax for an individual under the specified regime.
    
    Args:
        income: Taxable income (after deductions have already been subtracted)
        regime: 'old' or 'new'
    
    Returns:
        Dict with full breakdown: income, base_tax, surcharge, rebate_87a, cess, total_tax
    """
    slabs = NEW_REGIME_SLABS if regime == "new" else OLD_REGIME_SLABS

    base_tax = _apply_slabs(income, slabs)
    surcharge = _apply_surcharge(base_tax, income, regime)
    rebate = _apply_rebate_87a(base_tax + surcharge, income, regime)

    tax_after_rebate = max((base_tax + surcharge) - rebate, 0)
    cess = round(tax_after_rebate * 0.04, 2)
    total_tax = round(tax_after_rebate + cess, 2)

    return {
        "income": income,
        "base_tax": base_tax,
        "surcharge": surcharge,
        "rebate_87a": rebate,
        "cess": cess,
        "tax": base_tax,  # Backward compat field
        "total_tax": total_tax,
        "engine_version": MODULE_VERSION
    }


def calculate_hra_exemption(basic_salary, hra_received, rent_paid, is_metro=True):
    """
    Calculate HRA exemption under Section 10(13A) — Old Regime only.
    
    The exemption is the MINIMUM of:
      1. Actual HRA received from employer
      2. 50% of basic salary (metro) or 40% (non-metro)
      3. Rent paid minus 10% of basic salary
    
    Args:
        basic_salary: Annual basic salary
        hra_received: Actual HRA received from employer
        rent_paid: Total annual rent paid
        is_metro: True for Delhi/Mumbai/Kolkata/Chennai
    
    Returns:
        Dict with all three legs and the final exemption amount.
    """
    metro_rate = 0.50 if is_metro else 0.40
    
    leg1_actual_hra = hra_received
    leg2_percent_basic = round(basic_salary * metro_rate, 2)
    leg3_rent_minus_10 = max(round(rent_paid - (basic_salary * 0.10), 2), 0)
    
    exemption = round(min(leg1_actual_hra, leg2_percent_basic, leg3_rent_minus_10), 2)
    
    return {
        "actual_hra": leg1_actual_hra,
        "percent_of_basic": leg2_percent_basic,
        "rent_minus_10_percent": leg3_rent_minus_10,
        "exemption": exemption,
        "metro_city": is_metro,
        "engine_version": MODULE_VERSION
    }
