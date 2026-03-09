def calculate_firm_tax(income):

    tax = income * 0.30
    cess = tax * 0.04

    return {
        "income": income,
        "tax": tax,
        "cess": cess,
        "total_tax": tax + cess
    }
