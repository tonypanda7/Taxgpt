import chromadb
import ollama
from scripts.detect_intent import detect_intent
from scripts.extract_tax_info import extract_tax_info
from tax_engine.individual_tax import calculate_individual_tax
from tax_engine.business_tax import calculate_business_tax
from tax_engine.firm_tax import calculate_firm_tax

conversation_history = []
# connect to chroma database
client = chromadb.PersistentClient(path="kb")
collection = client.get_collection("tax_kb")

print("TaxGPT ready. Ask your tax questions.")
print("Type 'exit' to quit.\n")

while True:

    question = input("You: ").strip()
    intent = detect_intent(question)

    if question.lower() in ["exit", "quit"]:
        break

    # ---------------- EMBED QUERY ----------------

    query_embedding = ollama.embeddings(
        model="nomic-embed-text",
        prompt=question
    )["embedding"]

    # ---------------- VECTOR SEARCH ----------------

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=80
    )

    retrieved_docs = results["documents"][0]
    retrieved_meta = results["metadatas"][0]

    # ---------------- HYBRID KEYWORD SCORING ----------------

    keywords = question.lower().split()

    scored_chunks = []

    for doc, meta in zip(retrieved_docs, retrieved_meta):

        score = 0

        doc_lower = doc.lower()

        # keyword matching score
        for word in keywords:
            if len(word) > 2 and word in doc_lower:
                score += 1

        # skip tiny fragments
        if len(doc) < 120:
            continue

        scored_chunks.append((score, doc, meta))

    # ---------------- RERANK ----------------

    scored_chunks.sort(reverse=True, key=lambda x: x[0])

    top_chunks = scored_chunks[:5]

    documents = [x[1] for x in top_chunks]
    sources = [x[2] for x in top_chunks]

    # ---------------- NO CONTEXT FOUND ----------------

    if not documents:
        print("\nTaxGPT: I don't know based on the knowledge base.\n")
        continue

    MAX_CONTEXT = 40000

    context = ""
    for doc in documents:
        if len(context) + len(doc) > MAX_CONTEXT:
            break
        context += doc + "\n\n"
    if intent == "tax_calculation":
        tax_info = extract_tax_info(question, context)
        if tax_info:

            ttype = tax_info["taxpayer_type"]
            income = tax_info["income"]
            expenses = tax_info["expenses"]
            deductions = tax_info["deductions"]

            taxable_income = income - deductions

            if ttype == "individual":
                result = calculate_individual_tax(taxable_income)

            elif ttype == "business":
                result = calculate_business_tax(income, expenses)

            elif ttype == "firm":
                result = calculate_firm_tax(income)

            else:
                result = calculate_individual_tax(taxable_income)

            print("\nTax Calculation:")
            print(result)
            continue


    print("\nRetrieved Context:\n")
    print(context)
    print()

    # ---------------- LLM PROMPT ----------------

    prompt = f"""
        You are TaxGPT, an expert AI assistant specialized in Indian taxation.

        Your job:
        - Explain tax rules clearly
        - Answer conversationally
        - Help users understand tax laws
        - Use retrieved context when relevant

        Guidelines:
        - Prefer information from the context
        - If context is insufficient, say you are unsure
        - Speak naturally like a human assistant
        - Explain step-by-step if needed

        Retrieved context:
        {context}

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
        conversation_history = conversation_history[-10:]
    print("TaxGPT:", answer)

    # ---------------- UNIQUE SOURCES ----------------

    print("\nSources:")

    seen = set()

    for s in sources:
        if s and "url" in s:
            url = s["url"]
            if url not in seen:
                print("-", url)
                seen.add(url)

    print()