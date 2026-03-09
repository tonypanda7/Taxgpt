import ollama

def suggest_deductions(question, context):

    prompt = f"""
You are a tax advisor.

Based on the user's financial situation and tax rules in the context,
suggest possible deductions they could claim.

Rules:
- Suggest only deductions allowed in Indian tax law
- Mention section number if available
- Give practical suggestions

Context:
{context}

User situation:
{question}
"""

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature":0.2},
        messages=[{"role":"user","content":prompt}]
    )

    return response["message"]["content"]
