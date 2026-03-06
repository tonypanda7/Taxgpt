import chromadb
import ollama

# connect to persistent chroma database
client = chromadb.PersistentClient(path="kb")

collection = client.get_collection("tax_kb")

question = "What is the deduction limit under section 80C?"

results = collection.query(
    query_texts=[question],
    n_results=3
)

context = "\n".join(results["documents"][0])

prompt = f"""
Answer the question using the tax rule context.

Context:
{context}

Question:
{question}
"""

response = ollama.chat(
    model="phi3",
    messages=[{"role": "user", "content": prompt}]
)

print(response["message"]["content"])