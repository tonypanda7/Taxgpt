const API_BASE = "http://localhost:8000";

/**
 * Upload a document for OCR extraction.
 * Calls POST /documents/upload with multipart form data.
 */
export async function uploadDocument(file, docType, financialYear) {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({
    doc_type: docType,
    financial_year: financialYear,
  });

  const res = await fetch(`${API_BASE}/documents/upload?${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

/**
 * Poll the OCR processing status.
 * Calls GET /documents/{id}/status
 */
export async function getDocumentStatus(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}/status`);
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return res.json();
}

/**
 * Get the extracted data after OCR completes.
 * Calls GET /documents/{id}/extraction
 */
export async function getExtraction(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}/extraction`);
  if (!res.ok) throw new Error(`Extraction fetch failed (${res.status})`);
  return res.json();
}

/**
 * Confirm extracted data and trigger tax recalculation.
 * Calls POST /documents/{id}/confirm
 */
export async function confirmDocument(docId, confirmedData) {
  const res = await fetch(`${API_BASE}/documents/${docId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmed_data: confirmedData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Confirm failed (${res.status})`);
  }
  return res.json();
}

/**
 * Correct a single extracted field.
 * Calls POST /documents/{id}/correct
 */
export async function correctField(docId, fieldName, correctedValue) {
  const res = await fetch(`${API_BASE}/documents/${docId}/correct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      field_name: fieldName,
      corrected_value: correctedValue,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Correct failed (${res.status})`);
  }
  return res.json();
}
