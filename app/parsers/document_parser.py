import ollama
import json


def parse_financial_document(text):

    prompt = f"""
Extract structured financial data from this document.

Return JSON.

Fields:
- salary
- tds
- deductions
- employer
- financial_year

Document text:
{text}

Example output:

{{
 "salary":1200000,
 "tds":85000,
 "deductions":[
   {{"type":"80C","amount":150000}},
   {{"type":"80D","amount":25000}}
 ]
}}
"""

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature":0},
        messages=[{"role":"user","content":prompt}]
    )

    try:
        return json.loads(response["message"]["content"])
    except:
        return None