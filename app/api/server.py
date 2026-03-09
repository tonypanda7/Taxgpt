from fastapi import FastAPI, UploadFile, File
from app.rag.query_kb import process_query
from app.utils.gemini_ocr import ocr_image
from app.parsers.document_parser import parse_financial_document
import shutil
from app.database.user_data import SessionLocal, UserFinancialData
import os

app = FastAPI()

@app.get("/")
def home():
    return {"message": "TaxGPT running"}

@app.post("/chat")
def chat(query: str):

    response = process_query(query)

    return {
        "question": query,
        "answer": response
    }


# -------- Document Auto-Parse Endpoint --------

@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):

    temp_path = f"temp_{file.filename}"

    # save uploaded file
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # OCR using Gemini
    extracted_text = ocr_image(temp_path)

    # parse financial data
    structured_data = parse_financial_document(extracted_text)

    # -------- STORE DATA IN DATABASE --------
    if structured_data:

        db = SessionLocal()

        record = UserFinancialData(
            user_id=1,
            document_type="financial_document",
            data=structured_data
        )

        db.add(record)
        db.commit()
        db.close()

    # delete temp file
    os.remove(temp_path)

    return {
        "extracted_text": extracted_text,
        "structured_data": structured_data
    }
