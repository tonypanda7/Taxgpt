import json
import os

input_file = "data/cleaned/80c_clean.txt"
output_file = "data/chunks/80c_chunks.json"

os.makedirs("data/chunks", exist_ok=True)

with open(input_file, encoding="utf-8") as f:
    text = f.read()

def chunk_text(text, chunk_size=200, overlap=50):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks

chunks = chunk_text(text)

with open(output_file, "w") as f:
    json.dump(chunks, f)

print("Chunks created:", len(chunks))