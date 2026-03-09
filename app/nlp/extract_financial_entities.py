import ollama
import json


def extract_financial_entities(question, context):

    prompt = f"""
You are a financial entity extractor.

Identify all financial values in the user query.

Use the context to understand which tax deduction or income category they belong to.

Return JSON.

Fields:
- income_sources
- deductions
- expenses

Example output:

{{
"income_sources":[
   {{"type":"salary","amount":1200000}}
],

"deductions":[
   {{"type":"80C","amount":150000,"reason":"PPF investment"}},
   {{"type":"80D","amount":25000,"reason":"health insurance"}}
],

"expenses":[]
}}

Context:
{context}

User query:
{question}
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