from dotenv import load_dotenv
load_dotenv()  # Must be before any imports that read env vars

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import documents, tax
from db.database import engine, Base

# Create tables if not using migrations directly on boot
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaxCopilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(tax.router)

@app.get("/")
def read_root():
    return {"message": "TaxCopilot Backend Running"}
