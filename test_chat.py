import requests
import json

url = "http://127.0.0.1:8000/tax/chat"
headers = {"Content-Type": "application/json"}
data = {"query": "Explain Advance Tax"}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
