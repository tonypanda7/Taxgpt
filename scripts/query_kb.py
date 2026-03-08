import chromadb
import ollama

# connect to chroma database
client = chromadb.PersistentClient(path="kb")
collection = client.get_collection("tax_kb")

print("TaxGPT ready. Ask your tax questions.")
print("Type 'exit' to quit.\n")

while True:

    question = input("You: ").strip()

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
        n_results=50
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

    top_chunks = scored_chunks[:12]

    documents = [x[1] for x in top_chunks]
    sources = [x[2] for x in top_chunks]

    # ---------------- NO CONTEXT FOUND ----------------

    if not documents:
        print("\nTaxGPT: I don't know based on the knowledge base.\n")
        continue

    MAX_CONTEXT = 4000

    context = ""

    for doc in documents:
        if len(context) + len(doc) > MAX_CONTEXT:
            break
        context += doc + "\n\n"

    print("\nRetrieved Context:\n")
    print(context)
    print()

    # ---------------- LLM PROMPT ----------------

    prompt = f"""
You are a tax assistant.

STRICT RULES:
- Use ONLY the provided context.
- Do NOT use outside knowledge.
- Do NOT guess.
- If the answer is not clearly written in the context,
  reply: "I don't know based on the knowledge base."

Context:
{context}

Question:
{question}

Answer clearly using only the context.
"""

    response = ollama.chat(
        model="qwen2.5",
        options={"temperature": 0},
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response["message"]["content"]

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