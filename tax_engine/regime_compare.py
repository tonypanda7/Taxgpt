from tax_engine.individual_tax import calculate_individual_tax

def compare_regimes(income, deductions):

    taxable_old = income - deductions
    old_tax = calculate_individual_tax(taxable_old)

    new_tax = calculate_individual_tax(income)

    return {
        "old_regime_tax": old_tax["total_tax"],
        "new_regime_tax": new_tax["total_tax"]
    }