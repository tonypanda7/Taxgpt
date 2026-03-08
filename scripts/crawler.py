import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import os
import hashlib
import time
from pdfminer.high_level import extract_text

# ---------------- SEED URLS ----------------

seed_urls = [

"https://www.incometax.gov.in/iec/foportal/",
"https://incometaxindia.gov.in/pages/default.aspx",
"https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx"

]

# ---------------- SETTINGS ----------------

allowed_domains = [
"incometax.gov.in",
"incometaxindia.gov.in"
]

max_pages = 300

tax_keywords = [
"tax","income","income-tax","taxation","deduction","rebate","refund",
"tds","advance-tax","capital-gains","gst","tax-slab","tax-rate",
"assessment","return","itr","itr1","itr2","itr3","itr4","filing",
"finance-act","direct-tax","corporate-tax","taxpayer",
"80c","80d","80e","80g","section-80","section-10","section-24",
"hra","standard-deduction","salary","gross-income","taxable-income",
"ppf","epf","nps","life-insurance",
"capital-gain","long-term-capital","short-term-capital",
"financial-year","assessment-year","tax-planning",
"tax-calculation","tax-liability","tax-refund",
"tax-law","income-tax-act","cbdt","finance-bill"
]

# ---------------- DIRECTORIES ----------------

os.makedirs("data/raw", exist_ok=True)

# ---------------- LOAD VISITED URLS ----------------

if os.path.exists("data/visited_urls.json"):
    try:
        with open("data/visited_urls.json") as f:
            visited = set(json.load(f))
    except:
        visited = set()
else:
    visited = set()

# ---------------- LOAD PAGE HASHES ----------------

if os.path.exists("data/page_hashes.json"):
    try:
        with open("data/page_hashes.json") as f:
            page_hashes = json.load(f)
    except:
        page_hashes = {}
else:
    page_hashes = {}

# ---------------- QUEUE ----------------

queue = list(seed_urls)

# ---------------- HELPER FUNCTIONS ----------------

def get_hash(text):
    return hashlib.md5(text.encode()).hexdigest()

def valid_url(url):
    parsed = urlparse(url)
    for domain in allowed_domains:
        if domain in parsed.netloc:
            return True
    return False

def relevant(url):
    url_lower = url.lower()
    for word in tax_keywords:
        if word in url_lower:
            return True
    return False

def is_pdf(url):
    return url.lower().endswith(".pdf")

def skip_file(url):
    skip_ext = (
        ".jpg",".jpeg",".png",".gif",
        ".doc",".docx",".xls",".xlsx",
        ".zip",".rar",".mp4",".mp3"
    )
    return url.lower().endswith(skip_ext)

# ---------------- CRAWLER ----------------

count = 0

while queue and count < max_pages:

    url = queue.pop(0)

    if url in visited:
        continue

    print("Crawling:", url)

    try:
        response = requests.get(url, timeout=10)
    except:
        continue

    # ---------------- HANDLE PDF ----------------

    if is_pdf(url):

        print("Downloading PDF:", url)

        pdf_path = f"data/raw/pdf_{count}.pdf"

        try:
            with open(pdf_path, "wb") as f:
                f.write(response.content)
        except:
            continue

        try:
            text = extract_text(pdf_path)
        except:
            print("PDF extraction failed:", url)
            continue

        file_name = f"data/raw/page_{count}.json"

        data = {
            "url": url,
            "domain": urlparse(url).netloc,
            "text": text[:50000]
        }

        with open(file_name,"w",encoding="utf-8") as f:
            json.dump(data,f,indent=2)

        visited.add(url)
        count += 1
        continue

    # ---------------- HANDLE HTML ----------------

    content_type = response.headers.get("Content-Type", "")

    if "text/html" not in content_type:
        print("Skipping non-HTML:", url)
        visited.add(url)
        continue

    soup = BeautifulSoup(response.text, "html.parser")

    # remove scripts/styles
    for s in soup(["script","style"]):
        s.extract()

    text = soup.get_text(separator="\n")

    new_hash = get_hash(text)

    if url in page_hashes and page_hashes[url] == new_hash:
        print("No change:", url)
    else:

        print("New or updated page:", url)

        file_name = f"data/raw/page_{count}.json"

        data = {
            "url": url,
            "domain": urlparse(url).netloc,
            "text": text[:50000]
        }

        with open(file_name,"w",encoding="utf-8") as f:
            json.dump(data,f,indent=2)

        page_hashes[url] = new_hash
        count += 1

    visited.add(url)

    # ---------------- DISCOVER LINKS ----------------

    for link in soup.find_all("a", href=True):

        new_url = urljoin(url, link["href"])

        if skip_file(new_url):
            continue

        if valid_url(new_url) and relevant(new_url):

            if new_url not in visited and new_url not in queue:
                queue.append(new_url)

    time.sleep(1)

# ---------------- SAVE STATE ----------------

with open("data/visited_urls.json","w") as f:
    json.dump(list(visited),f)

with open("data/page_hashes.json","w") as f:
    json.dump(page_hashes,f)

print("Crawling finished")