import json
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

# persistent database
client = chromadb.PersistentClient(path="kb")

collection = client.get_or_create_collection("tax_kb")

with open("data/chunks/80c_chunks.json") as f:
    chunks = json.load(f)

for i, chunk in enumerate(chunks):

    embedding = model.encode(chunk).tolist()

    collection.add(
        documents=[chunk],
        embeddings=[embedding],
        ids=[str(i)]
    )

print("Knowledge base built")