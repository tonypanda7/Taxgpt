import google.generativeai as genai
import os
from dotenv import load_dotenv


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.5-flash")

def get_gemini_context(question):

    prompt = f"""
You are a tax knowledge assistant.

Provide background knowledge related to this question.

Rules:
- Maximum 200 words
- Only factual information
- Focus on Indian taxation
- No explanations outside tax law
- Be concise

Question:
{question}
"""

    response = model.generate_content(prompt)

    text = response.text

    # Hard safety limit
    words = text.split()

    if len(words) > 200:
        text = " ".join(words[:200])

    return text