import ollama

def detect_intent(question):

    prompt = f"""
Classify the user query.

Return ONLY one word.

Possible outputs:
- tax_calculation
- tax_question

User query:
{question}
"""

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature":0},
        messages=[{"role":"user","content":prompt}]
    )

    intent = response["message"]["content"].strip().lower()

    return intent
