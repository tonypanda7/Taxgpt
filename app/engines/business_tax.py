from app.engines.individual_tax import calculate_individual_tax


def calculate_business_tax(revenue, expenses, regime="new"):
    """Calculate tax for a business owner based on profit (revenue - expenses)."""

    profit = max(revenue - expenses, 0)
    result = calculate_individual_tax(profit, regime=regime)
    result["revenue"] = revenue
    result["expenses"] = expenses
    result["profit"] = profit
    return result
