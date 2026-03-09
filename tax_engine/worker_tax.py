from tax_engine.individual_tax import calculate_individual_tax


def calculate_worker_tax(income):
    """Calculate tax for a gig/freelance worker under Section 44ADA presumptive taxation."""

    # Under 44ADA, 50% of gross receipts is deemed profit
    presumptive_income = income * 0.50

    result = calculate_individual_tax(presumptive_income, regime="new")

    # Apply rebate rule for new regime
    if presumptive_income <= 700000:
        result["tax"] = 0
        result["base_tax"] = 0
        result["surcharge"] = 0
        result["rebate_87a"] = 0
        result["cess"] = 0
        result["total_tax"] = 0

    result["gross_receipts"] = income
    result["presumptive_income"] = presumptive_income
    return result