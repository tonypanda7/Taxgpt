import requests
from bs4 import BeautifulSoup
import os

# URL to scrape
url = "https://cleartax.in/s/80c-deductions"

# Request webpage
response = requests.get(url)
response.raise_for_status()

# Parse HTML
soup = BeautifulSoup(response.text, "html.parser")

# Extract text
text = soup.get_text(separator="\n")

# Ensure directory exists
os.makedirs("data/raw", exist_ok=True)

# File path
file_path = "data/raw/80c_page.txt"

# Save text
with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Page saved to {file_path}")