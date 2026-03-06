import re
import os

input_file = "data/raw/80c_page.txt"
output_file = "data/cleaned/80c_clean.txt"

os.makedirs("data/cleaned", exist_ok=True)

with open(input_file, encoding="utf-8") as f:
    text = f.read()

# remove excessive spaces and newlines
text = re.sub(r'\n+', '\n', text)
text = re.sub(r'\s+', ' ', text)

with open(output_file, "w", encoding="utf-8") as f:
    f.write(text)

print("Cleaned text saved to", output_file)