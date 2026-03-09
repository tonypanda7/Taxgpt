# 🧾 AI Tax Copilot 

>  An AI-powered tax planning platform that combines a deterministic tax engine with RAG-grounded AI to give Indian taxpayers accurate, personalized tax guidance — not hallucinated numbers.

---

## 🚀 How to Run

### Prerequisites
- Python 3.12+
- A [.env](file:///d:/Programming/ssn_hack/Taxgpt/.env) file with `GEMINI_API_KEY=your_key`

### Start the API Server
```bash
cd d:\Programming\ssn_hack\Taxgpt
pip install -r requirements.txt   # if first time
uvicorn main:app --reload
```

Server runs at **http://127.0.0.1:8000**
- Swagger docs: **http://127.0.0.1:8000/docs** ← show this to judges!

### Run the CLI Chatbot (RAG pipeline)
```bash
python main_cli.py
# or
python -c "from app.rag.query_kb import run_taxgpt; run_taxgpt()"
```

---

## 🏗️ Architecture — The Golden Rule

> **"The AI never produces tax figures. The engine never produces explanations."**

This is the core design principle. Every rupee amount shown to users comes from deterministic Python code, never from an LLM. The AI only *explains* what the engine calculated.

```mermaid
graph LR
    A[User Input] --> B[Security Gate<br/>PII Masking]
    B --> C[Entity Extractor<br/>Gemini AI]
    C --> D[Profile Builder<br/>SQLAlchemy]
    D --> E[Tax Engine<br/>Deterministic Python]
    E --> F[RAG Retriever<br/>ChromaDB]
    F --> G[Response Generator<br/>Ollama/GPT]
    G --> H[Validator<br/>Golden Rule Check]
    H --> I[User Response]
```

---

