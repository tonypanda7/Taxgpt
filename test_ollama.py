import ollama

try:
    print("Testing chat model...")
    response = ollama.chat(model="qwen2.5", messages=[{"role": "user", "content": "hello"}])
    print("Chat successful!")
    
    print("Testing embed model...")
    embedding = ollama.embeddings(model="nomic-embed-text", prompt="test")
    print("Embed successful!")
except Exception as e:
    print(f"Ollama error: {e}")
