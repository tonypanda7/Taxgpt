import os
import re
import json

raw_folder = "data/raw"
clean_folder = "data/cleaned"

os.makedirs(clean_folder, exist_ok=True)


def clean_text(text):

    # remove urls
    text = re.sub(r'http\S+', '', text)

    # remove navigation / UI text commonly scraped
    noise_patterns = [
        r'Home\s+About\s+Contact',
        r'Last Updated.*',
        r'Copyright.*',
        r'Skip to main content',
        r'Back to top',
        r'Privacy Policy',
        r'Terms and Conditions'
    ]

    for pattern in noise_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # normalize spaces
    text = re.sub(r'\s+', ' ', text)

    # restore line breaks around headings
    text = re.sub(r'\. ', '.\n', text)

    lines = text.split("\n")
    cleaned_lines = []

    for line in lines:
        line = line.strip()

        # remove very short lines (navigation etc.)
        if len(line) < 40:
            continue

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


for file in os.listdir(raw_folder):

    if not file.endswith(".json"):
        continue

    input_path = os.path.join(raw_folder, file)
    output_path = os.path.join(clean_folder, file)

    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    text = data["text"]

    cleaned = clean_text(text)

    cleaned_data = {
        "url": data["url"],
        "domain": data["domain"],
        "text": cleaned
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, indent=2)

    print("Cleaned:", file)

print("All pages cleaned.")