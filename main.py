from fastapi import FastAPI
from api import documents, tax, chat
from db.database import engine, Base

# Create tables on boot (including new chat_messages table)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaxCopilot API")

app.include_router(documents.router)
app.include_router(tax.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "TaxCopilot Backend Running"}

