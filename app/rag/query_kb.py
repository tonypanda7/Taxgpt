import chromadb
import ollama

from app.nlp.detect_intent import detect_intent
from app.nlp.extract_financial_entities import extract_financial_entities
from app.services.suggest_deductions import suggest_deductions
from app.utils.gemini_context import get_gemini_context

from tax_engine.individual_tax import calculate_individual_tax
from tax_engine.business_tax import calculate_business_tax
from tax_engine.firm_tax import calculate_firm_tax
from tax_engine.worker_tax import calculate_worker_tax
from tax_engine.regime_compare import compare_regimes
from db.database import SessionLocal
from db.models import FinancialProfile

conversation_history = []

# connect to chroma database
client = chromadb.PersistentClient(path="kb")
collection = client.get_collection("tax_kb")


# ==============================
# MAIN QUERY FUNCTION (FOR API)
# ==============================

def process_query(question):
    db = SessionLocal()

    profiles = db.query(FinancialProfile).all()

    user_context = ""

    for p in profiles:
        user_context += (
            f"FY: {p.financial_year}, Income: {p.total_income}, "
            f"Deductions: {p.total_deductions}, TDS: {p.total_tds}, "
            f"Old Tax: {p.calculated_old_tax}, New Tax: {p.calculated_new_tax}\n"
        )

    db.close()
    intent = detect_intent(question)

    # ---------- EMBED QUERY ----------

    query_embedding = ollama.embeddings(
        model="nomic-embed-text",
        prompt=question
    )["embedding"]

    # ---------- VECTOR SEARCH ----------

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=20
    )

    retrieved_docs = results["documents"][0]
    retrieved_meta = results["metadatas"][0]

    # ---------- KEYWORD SCORING ----------

    keywords = question.lower().split()
    scored_chunks = []

    for doc, meta in zip(retrieved_docs, retrieved_meta):

        score = 0
        doc_lower = doc.lower()

        for word in keywords:
            if len(word) > 2 and word in doc_lower:
                score += 1

        if len(doc) < 120:
            continue

        scored_chunks.append((score, doc, meta))

    scored_chunks.sort(reverse=True, key=lambda x: x[0])
    top_chunks = scored_chunks[:5]

    documents = [x[1] for x in top_chunks]
    sources = [x[2] for x in top_chunks]

    if not documents:
        return {"answer": "I don't know based on the knowledge base."}

    # ---------- BUILD CONTEXT ----------

    MAX_CONTEXT = 5000
    context = ""

    for doc in documents:
        if len(context) + len(doc) > MAX_CONTEXT:
            break
        context += doc + "\n\n"

    gemini_context = get_gemini_context(question)

    final_context = f"""
Database Context:
{context}

External Knowledge:
{gemini_context}
"""

    # ---------- TAX CALCULATION ----------

    if intent == "tax_calculation":

        entities = extract_financial_entities(question, final_context)

        if entities:

            income_sources = entities.get("income_sources", [])

            if not income_sources:
                return {"answer": "I could not detect income in your query."}

            income = sum(i["amount"] for i in income_sources)

            deduction_list = entities.get("deductions", [])
            deductions = sum(d.get("amount", 0) for d in deduction_list)

            taxable_income = income - deductions

            taxpayer_type = entities.get("taxpayer_type", "individual")

            if taxpayer_type == "business":

                expenses = sum(e["amount"] for e in entities.get("expenses", []))
                result = calculate_business_tax(income, expenses)

            elif taxpayer_type == "firm":

                result = calculate_firm_tax(income)

            elif taxpayer_type == "worker":

                result = calculate_worker_tax(taxable_income)

            else:

                result = calculate_individual_tax(taxable_income)

            comparison = compare_regimes(income, deductions)

            suggestions = suggest_deductions(question, final_context)

            return {
                "income": income,
                "deductions": deductions,
                "taxable_income": taxable_income,
                "tax": result["tax"],
                "cess": result["cess"],
                "total_tax": result["total_tax"],
                "old_regime_tax": comparison["old_regime_tax"],
                "new_regime_tax": comparison["new_regime_tax"],
                "suggestions": suggestions
            }

    # ---------- LLM ANSWER ----------

    prompt = f"""
You are TaxGPT, an expert AI assistant specialized in Indian taxation.

Retrieved context:
{final_context}

User question:
{question}
"""

    messages = [
        {"role": "system", "content": "You are TaxGPT, an AI tax assistant."}
    ]

    messages += conversation_history
    messages.append({"role": "user", "content": prompt})

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature": 0.2},
        messages=messages
    )

    answer = response["message"]["content"]

    conversation_history.append({"role": "user", "content": question})
    conversation_history.append({"role": "assistant", "content": answer})

    if len(conversation_history) > 10:
        conversation_history[:] = conversation_history[-10:]

    return {"answer": answer, "sources": sources}


# ==============================
# CLI CHATBOT
# ==============================

def run_taxgpt():

    print("TaxGPT ready. Ask your tax questions.")
    print("Type 'exit' to quit.\n")

    while True:

        question = input("You: ").strip()

        if question.lower() in ["exit", "quit"]:
            break

        result = process_query(question)

        print("\nTaxGPT:", result["answer"])

        if "sources" in result:

            print("\nSources:")
            seen = set()

            for s in result["sources"]:
                if s and "url" in s:
                    url = s["url"]
                    if url not in seen:
                        print("-", url)
                        seen.add(url)

        print()
