import re
from sqlalchemy.orm import Session
from db.models import FinancialProfile

def validate_response_figures(response_text: str, user_id: str, financial_year: str, db: Session) -> bool:
    """
    Ensures that any rupee figure (₹X) mentioned by the LLM exactly exists in the user's
    calculated tax profile. This satisfies the Golden Rule of the project.
    """
    
    # Extract all numbers prefixed with ₹, ignoring commas
    pattern = r"₹\s*([0-9,]+(?:\.[0-9]+)?)"
    matches = re.findall(pattern, response_text)
    
    if not matches:
        return True # No figures mentioned, safe

    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id,
        FinancialProfile.financial_year == financial_year
    ).first()
    
    if not profile:
        return False # Mentions money but has no profile
        
    allowed_figures = {
        float(profile.total_income),
        float(profile.total_deductions),
        float(profile.total_tds),
        float(profile.calculated_old_tax),
        float(profile.calculated_new_tax),
        float(min(profile.calculated_old_tax, profile.calculated_new_tax)), # lowest tax liability
        0.0
    }
    
    for match in matches:
        # Convert parsed string back to float for comparison
        clean_val = match.replace(",", "")
        try:
            val = float(clean_val)
            if val not in allowed_figures:
                print(f"Hallucination Blocked! GPT tried to output ₹{val} but allowed figures are {allowed_figures}")
                return False
        except ValueError:
            return False # Unparseable number
            
    return True
