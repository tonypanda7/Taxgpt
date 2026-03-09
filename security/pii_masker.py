from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

# Initialize the engines globally so they are only loaded once
analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

# Custom PAN, Aadhaar, Bank, IFSC patterns shouldn't usually trigger default presidio but 
#. we can rely on standard Presidio or custom recognizers. For this implementation we use default.
# Real world: add custom regex recognizers for IN_PAN, IN_AADHAAR etc.

def mask_pii(text: str) -> str:
    """
    Masks PII like email, phone, and standard financial entities
    before sending to LLM.
    """
    if not text:
        return text
        
    # Standard PII entities we want to mask
    entities = [
        "EMAIL_ADDRESS", 
        "PHONE_NUMBER", 
        "IBAN_CODE", 
        "CREDIT_CARD",
        "CRYPTO",
        "IP_ADDRESS",
        "PERSON", # Optional: depending on if we need names
    ]
    
    results = analyzer.analyze(text=text, entities=entities, language='en')
    anonymized_result = anonymizer.anonymize(text=text, analyzer_results=results)
    
    return anonymized_result.text
    
