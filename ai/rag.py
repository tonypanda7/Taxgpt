"""
RAG Service — ChromaDB Vector Search + Hybrid Reranking

Uses nomic-embed-text via Ollama for embeddings.
Searches the ChromaDB knowledge base built by scripts/build_kb.py.
"""

import ollama
import chromadb
from typing import List, Dict, Any, Tuple

# Connect to existing ChromaDB knowledge base
_client = chromadb.PersistentClient(path="kb")

MAX_CONTEXT_CHARS = 5000


def _get_collection():
    """Get the tax_kb collection. Raises if KB not built yet."""
    return _client.get_collection("tax_kb")


def _hybrid_score(doc: str, keywords: List[str]) -> int:
    """Keyword matching score for hybrid reranking."""
    doc_lower = doc.lower()
    return sum(1 for w in keywords if len(w) > 2 and w in doc_lower)


def query_knowledge_base(
    question: str,
    n_results: int = 20,
    top_k: int = 5,
    min_chunk_len: int = 120
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Query the ChromaDB knowledge base with hybrid vector + keyword reranking.

    Args:
        question: User's question text.
        n_results: Number of initial vector search results.
        top_k: Number of final chunks to return after reranking.
        min_chunk_len: Minimum character length to keep a chunk.

    Returns:
        Tuple of (documents list, metadata list).
    """
    collection = _get_collection()

    # 1. Embed the question
    query_embedding = ollama.embeddings(
        model="nomic-embed-text",
        prompt=question
    )["embedding"]

    # 2. Vector search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    retrieved_docs = results["documents"][0]
    retrieved_meta = results["metadatas"][0]

    # 3. Hybrid keyword scoring + filter tiny fragments
    keywords = question.lower().split()
    scored = []

    for doc, meta in zip(retrieved_docs, retrieved_meta):
        if len(doc) < min_chunk_len:
            continue
        score = _hybrid_score(doc, keywords)
        scored.append((score, doc, meta))

    # 4. Rerank by keyword score (vector relevance is already implicit in ordering)
    scored.sort(reverse=True, key=lambda x: x[0])
    top = scored[:top_k]

    documents = [x[1] for x in top]
    sources = [x[2] for x in top]

    return documents, sources


def build_context(documents: List[str]) -> str:
    """Join retrieved chunks into a single context string, respecting max length."""
    context = ""
    for doc in documents:
        if len(context) + len(doc) > MAX_CONTEXT_CHARS:
            break
        context += doc + "\n\n"
    return context.strip()
