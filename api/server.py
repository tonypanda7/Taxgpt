from fastapi import FastAPI
from app.rag.query_kb import process_query

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