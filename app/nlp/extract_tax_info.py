import ollama
import json


def extract_tax_info(question, context):

    prompt = f"""
You are an AI tax parser.

Extract structured tax information from the user query.

Return JSON ONLY.

Fields:
- taxpayer_type (individual, business, firm, worker)
- income
- expenses
- deductions

Context:
{context}

User question:
{question}

Example output:

{{
"taxpayer_type":"individual",
"income":1200000,
"expenses":0,
"deductions":0
}}
"""

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature":0},
        messages=[{"role":"user","content":prompt}]
    )

    text = response["message"]["content"]

    try:
        return json.loads(text)
    except:
        return None
