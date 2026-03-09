"""
Deterministic deduction suggestions based on what the user has already claimed.
No LLM required — uses hardcoded Indian tax law limits for FY 2024-25.
"""


# FY 2024-25 deduction limits
DEDUCTION_LIMITS = {
    "80C": {
        "description": "ELSS, PPF, EPF, Life Insurance, NSC, Tax-saving FD",
        "max_limit": 150000,
    },
    "80D": {
        "description": "Health insurance premium (self + family)",
        "max_limit": 25000,  # 50000 for senior citizens
    },
    "80CCD(1B)": {
        "description": "Additional NPS contribution",
        "max_limit": 50000,
    },
    "80TTA": {
        "description": "Interest on savings bank account",
        "max_limit": 10000,
    },
    "24(b)": {
        "description": "Home loan interest deduction",
        "max_limit": 200000,
    },
    "80E": {
        "description": "Interest on education loan",
        "max_limit": float("inf"),  # No upper limit, actual interest paid
    },
    "80G": {
        "description": "Donations to approved charities",
        "max_limit": float("inf"),  # Varies, 50% or 100% of donation
    },
}


def suggest_deductions(total_deductions, old_regime_tax_rate=0.30):
    """
    Generate a deterministic list of deduction opportunities based on
    what the user has already claimed vs. available limits.

    Args:
        total_deductions: Total deductions currently claimed by the user.
        old_regime_tax_rate: The user's marginal tax rate under old regime (for saving estimate).

    Returns:
        List of dicts with section, description, max_limit, current_claimed, potential_saving.
    """
    suggestions = []

    # We only know the aggregate total_deductions from the profile,
    # not the per-section breakdown. So we suggest sections where
    # the total leaves room for more investment.

    # Primary suggestion: 80C (most impactful, ₹1.5L limit)
    assumed_80c = min(total_deductions, 150000)
    remaining_80c = 150000 - assumed_80c
    if remaining_80c > 0:
        suggestions.append({
            "section": "80C",
            "description": DEDUCTION_LIMITS["80C"]["description"],
            "max_limit": 150000,
            "current_claimed": assumed_80c,
            "potential_saving": round(remaining_80c * old_regime_tax_rate, 2),
        })

    # 80CCD(1B) — NPS (always additional, on top of 80C)
    suggestions.append({
        "section": "80CCD(1B)",
        "description": DEDUCTION_LIMITS["80CCD(1B)"]["description"],
        "max_limit": 50000,
        "current_claimed": 0,  # Cannot infer from aggregate
        "potential_saving": round(50000 * old_regime_tax_rate, 2),
    })

    # 80D — Health insurance
    suggestions.append({
        "section": "80D",
        "description": DEDUCTION_LIMITS["80D"]["description"],
        "max_limit": 25000,
        "current_claimed": 0,
        "potential_saving": round(25000 * old_regime_tax_rate, 2),
    })

    # 80TTA — Savings interest
    suggestions.append({
        "section": "80TTA",
        "description": DEDUCTION_LIMITS["80TTA"]["description"],
        "max_limit": 10000,
        "current_claimed": 0,
        "potential_saving": round(10000 * old_regime_tax_rate, 2),
    })

    return suggestions