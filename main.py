from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import documents, tax
from db.database import engine, Base

# Create tables if not using migrations directly on boot
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaxCopilot API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(tax.router)

@app.get("/")
def read_root():
    return {"message": "TaxCopilot Backend Running"}
