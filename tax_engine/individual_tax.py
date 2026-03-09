def calculate_individual_tax(income):

    slabs = [
        (300000, 0),
        (300000, 0.05),
        (300000, 0.10),
        (300000, 0.15),
        (300000, 0.20),
        (float("inf"), 0.30)
    ]

    remaining = income
    tax = 0

    for slab, rate in slabs:

        taxable = min(remaining, slab)
        tax += taxable * rate

        remaining -= taxable

        if remaining <= 0:
            break

    cess = tax * 0.04

    return {
        "income": income,
        "tax": tax,
        "cess": cess,
        "total_tax": tax + cess
    }