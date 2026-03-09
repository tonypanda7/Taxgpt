import os
import json
import re
import hashlib

input_folder = "data/cleaned"
output_file = "data/chunks/all_chunks.json"

os.makedirs("data/chunks", exist_ok=True)


def chunk_text(text, chunk_size=330, overlap=50):

    sentences = re.split(r'(?<=[.!?]) +', text)

    chunks = []
    current = []

    for sentence in sentences:

        words = sentence.split()

        if len(current) + len(words) <= chunk_size:
            current.extend(words)

        else:

            chunk = " ".join(current)
            chunks.append(chunk)

            current = current[-overlap:] + words

    if current:
        chunks.append(" ".join(current))

    return chunks


all_chunks = []
seen = set()


for file in os.listdir(input_folder):

    if not file.endswith(".json"):
        continue

    path = os.path.join(input_folder, file)

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    text = data["text"]

    if len(text) < 200:
        continue

    url = data["url"]
    domain = data["domain"]

    chunks = chunk_text(text)

    for i, chunk in enumerate(chunks):

        # hash for duplicate detection
        h = hashlib.md5(chunk.encode()).hexdigest()

        if h in seen:
            continue

        seen.add(h)

        all_chunks.append({
            "id": f"{file}_{i}",
            "text": chunk,
            "url": url,
            "domain": domain
        })


with open(output_file, "w", encoding="utf-8") as f:
    json.dump(all_chunks, f, indent=2)


print("Total chunks created:", len(all_chunks))
