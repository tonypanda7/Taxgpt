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
        n_results=20
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
            if word in doc_lower:
                score += 1

        # skip tiny fragments
        if len(doc) < 120:
            continue

        scored_chunks.append((score, doc, meta))

    # ---------------- RERANK ----------------

    scored_chunks.sort(reverse=True, key=lambda x: x[0])

    top_chunks = scored_chunks[:3]

    documents = [x[1] for x in top_chunks]
    sources = [x[2] for x in top_chunks]

    # ---------------- NO CONTEXT FOUND ----------------

    if not documents:
        print("\nTaxGPT: I don't know based on the knowledge base.\n")
        continue

    context = "\n\n".join(documents)

    print("\nRetrieved Context:\n")
    print(context[:800])
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