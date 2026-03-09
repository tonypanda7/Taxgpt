"""
Advance Tax Calculator — FY 2024-25

Calculates advance tax installments and Section 234C interest for late payment.
Applies when estimated annual tax liability exceeds ₹10,000.

Installment Schedule:
  - 15 Jun: 15% of annual tax
  - 15 Sep: 45% of annual tax (cumulative)
  - 15 Dec: 75% of annual tax (cumulative)
  - 15 Mar: 100% of annual tax (cumulative)
"""

from app.engines.individual_tax import MODULE_VERSION

# Advance tax installment schedule: (due_date, cumulative_percent)
INSTALLMENTS = [
    ("2025-06-15", 0.15, "15 June 2025"),
    ("2025-09-15", 0.45, "15 September 2025"),
    ("2025-12-15", 0.75, "15 December 2025"),
    ("2026-03-15", 1.00, "15 March 2026"),
]

# Minimum threshold — advance tax applies only if annual tax > ₹10,000
ADVANCE_TAX_THRESHOLD = 10000

# Section 234C interest rate (1% per month of shortfall)
SECTION_234C_RATE = 0.01


def calculate_advance_tax(annual_tax_liability, tds_already_deducted=0):
    """
    Calculate advance tax schedule and interest for late/missed installments.
    
    Args:
        annual_tax_liability: Total estimated tax for the year (from engine).
        tds_already_deducted: TDS already deducted by employer/payer.
    
    Returns:
        Dict with schedule, total payable, and whether advance tax applies.
    """
    net_tax = max(annual_tax_liability - tds_already_deducted, 0)
    
    # Advance tax not required if net tax <= ₹10,000
    if net_tax <= ADVANCE_TAX_THRESHOLD:
        return {
            "advance_tax_applicable": False,
            "reason": f"Net tax liability (₹{net_tax:,.0f}) is below the ₹10,000 threshold.",
            "net_tax_liability": net_tax,
            "tds_already_deducted": tds_already_deducted,
            "installments": [],
            "engine_version": MODULE_VERSION
        }
    
    # Build installment schedule
    installments = []
    prev_cumulative = 0
    
    for due_date, cumulative_pct, display_date in INSTALLMENTS:
        current_pct = cumulative_pct - prev_cumulative
        installment_amount = round(net_tax * current_pct, 2)
        cumulative_amount = round(net_tax * cumulative_pct, 2)
        
        installments.append({
            "due_date": due_date,
            "display_date": display_date,
            "installment_percent": round(current_pct * 100),
            "cumulative_percent": round(cumulative_pct * 100),
            "installment_amount": installment_amount,
            "cumulative_amount": cumulative_amount,
        })
        
        prev_cumulative = cumulative_pct
    
    return {
        "advance_tax_applicable": True,
        "annual_tax_liability": annual_tax_liability,
        "tds_already_deducted": tds_already_deducted,
        "net_tax_liability": net_tax,
        "installments": installments,
        "engine_version": MODULE_VERSION
    }


def calculate_234c_interest(net_tax, payments_made):
    """
    Calculate Section 234C interest for shortfall in advance tax installments.
    
    Args:
        net_tax: Net tax liability for the year.
        payments_made: List of dicts with 'due_date' and 'amount_paid'.
                       One entry per installment quarter.
    
    Returns:
        Dict with per-quarter interest and total 234C interest.
    """
    if net_tax <= ADVANCE_TAX_THRESHOLD:
        return {"interest_234c": 0, "quarters": [], "engine_version": MODULE_VERSION}
    
    # Default: assume no payments made if list is shorter
    paid_amounts = [0, 0, 0, 0]
    for i, p in enumerate(payments_made[:4]):
        paid_amounts[i] = p.get("amount_paid", 0)
    
    cumulative_paid = 0
    quarters = []
    total_interest = 0
    
    for i, (due_date, cumulative_pct, display_date) in enumerate(INSTALLMENTS):
        required = round(net_tax * cumulative_pct, 2)
        cumulative_paid += paid_amounts[i]
        shortfall = max(required - cumulative_paid, 0)
        
        # Interest = 1% per month of shortfall, for 3 months (1 quarter)
        # Last quarter: 1 month only (March to March)
        months = 1 if i == 3 else 3
        interest = round(shortfall * SECTION_234C_RATE * months, 2)
        total_interest += interest
        
        quarters.append({
            "due_date": due_date,
            "display_date": display_date,
            "required_cumulative": required,
            "paid_cumulative": cumulative_paid,
            "shortfall": shortfall,
            "interest_months": months,
            "interest": interest,
        })
    
    return {
        "interest_234c": round(total_interest, 2),
        "quarters": quarters,
        "engine_version": MODULE_VERSION
    }
