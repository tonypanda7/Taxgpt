import os
import requests
import time

# Create a dummy pdf
dummy_file = "dummy_test.pdf"
with open(dummy_file, "wb") as f:
    f.write(b"%PDF-1.4 mock pdf content")

print("Uploading document...")
with open(dummy_file, "rb") as f:
    files = {"file": ("dummy_test.pdf", f, "application/pdf")}
    data = {"doc_type": "form16", "financial_year": "FY2024-25"}
    
    # Needs the API running on 8000
    try:
        response = requests.post("http://127.0.0.1:8000/documents/upload", files=files, params=data)
        print("Upload Response:", response.status_code, response.text)
        
        doc_id = response.json().get("id")
        
        if doc_id:
            print(f"\nPolling status for document {doc_id}...")
            for _ in range(3):
                time.sleep(1)
                stat_resp = requests.get(f"http://127.0.0.1:8000/documents/{doc_id}/status")
                print("Status:", stat_resp.json())
                
                if stat_resp.json().get("ocr_status") in ["complete", "failed"]:
                    break
                    
            print(f"\nGetting extraction results for document {doc_id}...")
            ext_resp = requests.get(f"http://127.0.0.1:8000/documents/{doc_id}/extraction")
            print("Extraction:", ext_resp.json())
            
    except requests.exceptions.ConnectionError:
        print("Server is not running on port 8000")

if os.path.exists(dummy_file):
    os.remove(dummy_file)
