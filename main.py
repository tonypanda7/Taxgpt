from fastapi import FastAPI
from api import documents
from db.database import engine, Base

# Create tables if not using migrations directly on boot
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaxCopilot API")

app.include_router(documents.router)

@app.get("/")
def read_root():
    return {"message": "TaxCopilot Backend Running"}
