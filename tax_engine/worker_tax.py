from tax_engine.individual_tax import calculate_individual_tax


def calculate_worker_tax(income):

    result = calculate_individual_tax(income)

    # rebate rule
    if income <= 700000:
        result["tax"] = 0
        result["cess"] = 0
        result["total_tax"] = 0

    return result