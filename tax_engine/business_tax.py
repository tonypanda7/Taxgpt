from tax_engine.individual_tax import calculate_individual_tax


def calculate_business_tax(revenue, expenses):

    profit = revenue - expenses

    return calculate_individual_tax(profit)