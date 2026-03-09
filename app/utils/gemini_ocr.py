import google.generativeai as genai
from PIL import Image
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def ocr_image(image_path):

    image = Image.open(image_path)

    prompt = """
Look at this image carefully.

Tasks:

1. Identify what this document or image is.
   Examples:
   - salary slip
   - Form 16
   - rent receipt
   - bank statement
   - GST invoice
   - medical bill
   - investment proof
   - random photo

2. Extract ALL visible text.

3. Determine if the document contains financial information about the user.

4. If financial data exists, extract structured information.

Return ONLY valid JSON in this format:

{
  "document_type": "",
  "description": "",
  "contains_user_financial_data": true/false,
  "extracted_text": "",
  "financial_data": {
      "salary": null,
      "tds": null,
      "deductions": [],
      "investments": [],
      "other_amounts": []
  }
}
"""

    response = model.generate_content([prompt, image])

    text = response.text

    try:
        return json.loads(text)
    except:
        # fallback if Gemini returns slightly malformed JSON
        return {
            "document_type": "unknown",
            "description": "Could not parse response",
            "contains_user_financial_data": False,
            "extracted_text": text,
            "financial_data": {}
        }
