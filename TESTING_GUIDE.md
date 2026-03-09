# How to Test AI Tax Copilot

This guide outlines how to manually test the different components of the Document Auto-Parser using standard HTTP tools or the built-in Swagger UI.

## Prerequisites

1.  **Virtual Environment**: Ensure your Python virtual environment is active.
2.  **Dependencies**: Run `pip install -r requirements.txt` (if you haven't already).
9.  **Environment Variables**: Ensure your `.env` file in the root directory contains the necessary API keys:
    ```env
    GEMINI_API_KEY=your_google_genai_key
    ```
4.  **Database**: The SQLite database (`taxcopilot.db`) is already created and migrated. If you ever need to reset it, delete the file and run:
    ```bash
    alembic upgrade head
    ```

## Starting the Server

Start the FastAPI application using Uvicorn:

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

---

## 1. Using the Swagger UI (Recommended)

FastAPI automatically generates an interactive API documentation interface. This is the easiest way to test the endpoints.

1.  Open your browser and navigate to: `http://127.0.0.1:8000/docs`
2.  You will see a list of all available endpoints grouped by their tags (`documents`).
3.  Click on an endpoint to expand it, then click the **"Try it out"** button.
4.  Fill in the required parameters and click **"Execute"**.

---

## 2. Testing via Terminal (cURL / PowerShell)

If you prefer the command line, here is the sequence of requests to test the full flow.

### Step 1: Upload a Document (OCR)

Upload a simulated Form 16 (or AIS/Salary Slip) to start the async extraction process.

**PowerShell:**
```powershell
# Create a dummy pdf first
$mockPdfPath = "mock_form16.pdf"
"Mock PDF Layer: PAN: ABCDE1234F, Gross Salary: 1500000" | Out-File -FilePath $mockPdfPath -Encoding ascii

# Send the request
Invoke-RestMethod -Uri "http://127.0.0.1:8000/documents/upload?doc_type=form16&financial_year=FY2024-25" `
  -Method Post `
  -Form @{
      file = Get-Item -Path $mockPdfPath
  }
```

*Take note of the `id` returned in the response.*

### Step 2: Poll for Status

Check if the background OCR process has finished analyzing the document.

**PowerShell:**
```powershell
# Replace <DOC_ID> with the ID from Step 1
Invoke-RestMethod -Uri "http://127.0.0.1:8000/documents/<DOC_ID>/status" -Method Get
```

*Wait until `ocr_status` is `"complete"`.*

### Step 3: View Extracted Data

Once complete, view the data extracted by Gemini.

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/documents/<DOC_ID>/extraction" -Method Get
```

### Step 4: Confirm Data and Calculate Tax

Submit the confirmed data to update your `FinancialProfile` and trigger the `tax_engine`.

**PowerShell:**
```powershell
# We provide mock structure here that matches the Gemini output format
$confirmBody = @{
    confirmed_data = @{
        gross_salary = @{ value = 1500000; confidence = 0.95 }
        tds_deducted = @{ value = 150000; confidence = 0.92 }
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/documents/<DOC_ID>/confirm" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $confirmBody
```

### Step 5: Compare Tax Regimes

After confirming at least one document, compare Old vs New regime.

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/tax/comparison?financial_year=FY2024-25" -Method Get
```

This returns the full breakdown per regime, the recommended regime, savings amount, breakeven investment needed to flip the recommendation, and a list of unclaimed deduction opportunities.

### Running Automated Tests

Run the full test suite:

```bash
python -m pytest tests/ -v
```
