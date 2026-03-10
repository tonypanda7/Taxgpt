import time
import requests

start = time.time()
print('Sending request to /tax/chat...')
response = requests.post('http://localhost:8000/tax/chat', json={'query': 'compare tax regimes for my salary'})
print(f'Response time: {time.time() - start:.2f} seconds')
print(f'Status code: {response.status_code}')
try:
    print(response.json())
except Exception as e:
    print('Failed to parse JSON:', e)
    print(response.text)
