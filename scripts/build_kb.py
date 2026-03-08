import json
import chromadb
import ollama
import re

# ---------------------------
# SETTINGS
# ---------------------------

MAX_CHARS = 800
OVERLAP = 150
MIN_CHARS = 80

EMBED_MODEL = "nomic-embed-text"


# ---------------------------
# TEXT CLEANER
# ---------------------------

def clean_text(text):
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


# ---------------------------
# SENTENCE SPLITTER
# ---------------------------

def split_text(text, max_chars=MAX_CHARS, overlap=OVERLAP):

    sentences = re.split(r'(?<=[.!?]) +', text)

    chunks = []
    current = ""

    for sentence in sentences:

        if len(current) + len(sentence) < max_chars:
            current = (current + " " + sentence).strip()
        else:
            if current:
                chunks.append(current)
            current = sentence.strip()

    if current:
        chunks.append(current)

    final_chunks = []

    for i, chunk in enumerate(chunks):

        if i == 0:
            final_chunks.append(chunk)
        else:
            prev_chunk = chunks[i-1]
            overlap_text = prev_chunk[max(0, len(prev_chunk)-overlap):]
            final_chunks.append((overlap_text + " " + chunk).strip())

    return final_chunks


# ---------------------------
# CONNECT CHROMADB
# ---------------------------

client = chromadb.PersistentClient(path="kb")

try:
    client.delete_collection("tax_kb")
except:
    pass

collection = client.get_or_create_collection("tax_kb")


# ---------------------------
# LOAD SCRAPED DATA
# ---------------------------

with open("data/chunks/all_chunks.json", encoding="utf-8") as f:
    chunks = json.load(f)


documents = []
embeddings = []
ids = []
metadatas = []

counter = 0


# ---------------------------
# PROCESS CHUNKS
# ---------------------------

for chunk in chunks:

    # combine title + text for better embeddings
    text = clean_text(chunk.get("title", "") + " " + chunk["text"])

    if len(text) < MIN_CHARS:
        continue

    parts = split_text(text)

    for part in parts:

        part = clean_text(part)

        if len(part) < MIN_CHARS:
            continue

        # safety limit to avoid ollama overflow
        part = part[:1000]

        try:
            emb = ollama.embeddings(
                model=EMBED_MODEL,
                prompt=part
            )["embedding"]

        except Exception as e:
            print("Embedding failed:", e)
            continue

        documents.append(part)
        embeddings.append(emb)

        ids.append(f"doc_{counter}")

        metadatas.append({
            "url": chunk.get("url", ""),
            "domain": chunk.get("domain", ""),
            "topic": "tax"
        })

        counter += 1


# ---------------------------
# INSERT INTO CHROMADB
# ---------------------------

print("Saving to ChromaDB...")

collection.add(
    documents=documents,
    embeddings=embeddings,
    metadatas=metadatas,
    ids=ids
)

print("Knowledge base built with", len(documents), "chunks")