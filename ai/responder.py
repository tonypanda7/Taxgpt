import os
from sqlalchemy.orm import Session
from db.models import FinancialProfile
import openai

def generate_chat_response(message: str, user_id: str, financial_year: str, db: Session) -> str:
    """Generates a chat response using GPT-4o-mini bounded by the user's financial profile."""
    
    # 1. Fetch user's profile
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == user_id,
        FinancialProfile.financial_year == financial_year
    ).first()
    
    context = "No financial profile found for this user in the specified year."
    if profile:
        context = f"""
        User Financial Profile for {financial_year}:
        Total Income: ₹{profile.total_income}
        Total Deductions: ₹{profile.total_deductions}
        Total TDS: ₹{profile.total_tds}
        Calculated Old Regime Tax: ₹{profile.calculated_old_tax}
        Calculated New Regime Tax: ₹{profile.calculated_new_tax}
        """

    system_prompt = f"""
    You are the AI Tax Copilot, a helpful financial assistant for Indian taxes.
    Your golden rule: NEVER hallucinate tax figures or calculate taxes yourself.
    Only use the exact figures provided in the context below. 
    If a user asks a general tax question, you can answer it based on Indian tax law.
    If they ask about their specific taxes, ONLY use the context below.
    
    CONTEXT:
    {context}
    """
    
    try:
        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "mock-key"))
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback for testing when OpenAI API key is missing
        return f"[MOCK RESPONSE] Based on your profile, your total income is ₹{profile.total_income if profile else 0} and tax is ₹{min(profile.calculated_old_tax, profile.calculated_new_tax) if profile else 0}."
