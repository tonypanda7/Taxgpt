import os
import json
import google.generativeai as genai
from typing import Dict, Any, Optional

# Load gemini key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")


def parse_gemini_json(response_text: str) -> Optional[Dict[str, Any]]:
    """Helper to try parsing the LLM response as JSON."""
    try:
        # Strip markdown ticks if the model returns them
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        return json.loads(clean_text)
    except json.JSONDecodeError:
        print(f"Failed to decode JSON from Gemini: {response_text}")
        return None


def calculate_aggregate_confidence(extracted: Dict[str, Any]) -> float:
    """Helper to calculate the average confidence across all extracted fields."""
    if not extracted:
        return 0.0
    
    total = sum(field.get("confidence", 0.0) for field in extracted.values() if isinstance(field, dict))
    count = sum(1 for field in extracted.values() if isinstance(field, dict))
    
    return round(total / count, 2) if count > 0 else 0.0


def extract_form16(text: str) -> Dict[str, Any]:
    """Extract Form 16 financial data using Gemini 1.5 Flash."""
    prompt = f"""
    You are an expert Indian tax data extractor. Extract the following fields from the Form 16 text provided.
    Return ONLY a single valid JSON object. Do not include any markdown wrap or explanations.
    
    Fields required: 
    employer_name, pan, gross_salary, standard_deduction, professional_tax, net_taxable_income, tds_deducted,
    section_80c_total, section_80d_total, hra_exemption, financial_year.
    
    For each field, return a dictionary with "value" and "confidence" (0.0 to 1.0).
    If a field is unreadable, set value to null and confidence to 0.0.
    
    Document Text:
    {text}
    """
    
    if not GEMINI_API_KEY:
        return {}
        
    response = model.generate_content(prompt)
    return parse_gemini_json(response.text) or {}


def extract_ais(text: str) -> Dict[str, Any]:
    """Extract AIS financial data using Gemini 1.5 Flash."""
    prompt = f"""
    You are an expert Indian tax data extractor. Extract the following fields from the AIS text provided.
    Return ONLY a single valid JSON object. Do not include any markdown wrap or explanations.
    
    Fields required:
    - income_sources: array of objects with {{source_type, amount, tds_deducted}}.
    - total_gross_income: total income sum.
    - total_tds: total TDS deduct sum.
    - high_value_transactions: array of transaction strings.
    
    For all top-level properties and array items, assign a "confidence" (0.0 to 1.0) and "value".
    For example: "total_gross_income": {{"value": 100000, "confidence": 0.95}}
    
    Document Text:
    {text}
    """
    
    if not GEMINI_API_KEY:
        return {}
        
    response = model.generate_content(prompt)
    return parse_gemini_json(response.text) or {}


def extract_salary_slip(text: str) -> Dict[str, Any]:
    """Extract Salary Slip financial data using Gemini 1.5 Flash."""
    prompt = f"""
    You are an expert Indian tax data extractor. Extract the following fields from the Salary Slip text provided.
    Return ONLY a single valid JSON object. Do not include any markdown wrap or explanations.
    
    Fields required: 
    month, year, basic_salary, hra, special_allowance, gross_salary, professional_tax, tds_this_month, net_salary.
    
    For each field, return a dictionary with "value" and "confidence" (0.0 to 1.0).
    If a field is unreadable, set value to null and confidence to 0.0.
    
    Document Text:
    {text}
    """
    
    if not GEMINI_API_KEY:
        return {}
        
    response = model.generate_content(prompt)
    return parse_gemini_json(response.text) or {}


def extract_rent_receipt(text: str) -> Dict[str, Any]:
    """Extract Rent Receipt financial data using Gemini 1.5 Flash."""
    prompt = f"""
    You are an expert Indian tax data extractor. Extract the following fields from the Rent Receipt text provided.
    Return ONLY a single valid JSON object. Do not include any markdown wrap or explanations.
    
    Fields required: 
    landlord_name, rent_amount, period_from, period_to, property_address.
    Note: For property_address, return only the City name.
    
    For each field, return a dictionary with "value" and "confidence" (0.0 to 1.0).
    If a field is unreadable, set value to null and confidence to 0.0.
    
    Document Text:
    {text}
    """
    
    if not GEMINI_API_KEY:
        return {}
        
    response = model.generate_content(prompt)
    return parse_gemini_json(response.text) or {}
