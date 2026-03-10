import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Edit2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';
import { uploadDocument, getDocumentStatus, getExtraction, confirmDocument, correctField } from '../utils/api';

const DOC_TYPES = [
    { value: 'form16', label: 'Form 16' },
    { value: 'ais', label: 'AIS' },
    { value: 'salary_slip', label: 'Salary Slip' },
    { value: 'rent_receipt', label: 'Rent Receipt' },
    { value: '26as', label: '26AS' },
    { value: 'investment_proof', label: 'Investment Proof' },
    { value: 'bank_statement', label: 'Bank Statement' },
];

const FINANCIAL_YEARS = ['FY 2024-25', 'FY 2023-24', 'FY 2022-23'];

/** Field labels for display */
const FIELD_LABELS = {
    employer_name: 'Employer Name',
    pan: 'PAN',
    gross_salary: 'Gross Salary',
    standard_deduction: 'Standard Deduction',
    professional_tax: 'Professional Tax',
    net_taxable_income: 'Net Taxable Income',
    tds_deducted: 'TDS Deducted',
    section_80c_total: '80C Investments',
    section_80d_total: '80D Investments',
    hra_exemption: 'HRA Exemption',
    financial_year: 'Financial Year',
    total_gross_income: 'Total Gross Income',
    total_tds: 'Total TDS',
    basic_salary: 'Basic Salary',
    hra: 'HRA',
    special_allowance: 'Special Allowance',
    tds_this_month: 'TDS This Month',
    net_salary: 'Net Salary',
    month: 'Month',
    year: 'Year',
    landlord_name: 'Landlord Name',
    rent_amount: 'Rent Amount',
    period_from: 'Period From',
    period_to: 'Period To',
    property_address: 'Property Address (City)',
};

const CURRENCY_FIELDS = new Set([
    'gross_salary', 'standard_deduction', 'professional_tax', 'net_taxable_income',
    'tds_deducted', 'section_80c_total', 'section_80d_total', 'hra_exemption',
    'total_gross_income', 'total_tds', 'basic_salary', 'hra', 'special_allowance',
    'tds_this_month', 'net_salary', 'rent_amount',
]);

export default function Documents() {
    const [dragActive, setDragActive] = useState(false);
    // idle | uploading | polling | complete | failed | confirming | confirmed
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [docType, setDocType] = useState('form16');
    const [financialYear, setFinancialYear] = useState('FY 2024-25');
    const [selectedFile, setSelectedFile] = useState(null);
    const [docId, setDocId] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [confidenceColor, setConfidenceColor] = useState(null);
    const [overallConfidence, setOverallConfidence] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmResult, setConfirmResult] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [fileName, setFileName] = useState('');
    const [rawText, setRawText] = useState(null);
    const pollRef = useRef(null);

    // ─── Confidence helpers ───
    const getConfidenceColor = (score) => {
        if (score >= 0.85) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (score >= 0.60) return "bg-amber-100 text-amber-800 border-amber-200";
        return "bg-red-100 text-red-800 border-red-200";
    };

    const getConfidenceIcon = (score) => {
        if (score >= 0.85) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
        if (score >= 0.60) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
        return <XCircle className="w-4 h-4 text-red-600" />;
    };

    // ─── Polling logic ───
    const startPolling = useCallback((id) => {
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(async () => {
            try {
                const status = await getDocumentStatus(id);

                if (status.ocr_status === 'complete') {
                    clearInterval(pollRef.current);
                    pollRef.current = null;

                    const extraction = await getExtraction(id);
                    setExtractedData(extraction.extracted_data || {});
                    setConfidenceColor(extraction.confidence_color);
                    setOverallConfidence(extraction.extraction_confidence);
                    setRawText(extraction.raw_text || null);
                    setUploadStatus('complete');
                } else if (status.ocr_status === 'failed') {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                    setErrorMessage('OCR processing failed. Please try again.');
                    setUploadStatus('failed');
                }
                // else still "pending" or "processing" — keep polling
            } catch (err) {
                clearInterval(pollRef.current);
                pollRef.current = null;
                setErrorMessage(err.message);
                setUploadStatus('failed');
            }
        }, 2000);
    }, []);

    // ─── Upload handler ───
    const handleUpload = async (file) => {
        setSelectedFile(file);
        setFileName(file.name);
        setUploadStatus('uploading');
        setErrorMessage('');
        setExtractedData(null);
        setConfirmResult(null);

        try {
            const result = await uploadDocument(file, docType, financialYear);
            setDocId(result.id);
            setUploadStatus('polling');
            startPolling(result.id);
        } catch (err) {
            setErrorMessage(err.message);
            setUploadStatus('failed');
        }
    };

    // ─── Drag & drop ───
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files?.[0]) handleUpload(e.target.files[0]);
    };

    // ─── Confirm ───
    const handleConfirm = async () => {
        if (!docId || !extractedData) return;
        setUploadStatus('confirming');
        try {
            const result = await confirmDocument(docId, extractedData);
            setConfirmResult(result);
            setUploadStatus('confirmed');
        } catch (err) {
            setErrorMessage(err.message);
            setUploadStatus('failed');
        }
    };

    // ─── Inline edit ───
    const startEdit = (fieldName, currentValue) => {
        setEditingField(fieldName);
        setEditValue(currentValue ?? '');
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEdit = async () => {
        if (!docId || !editingField) return;
        try {
            await correctField(docId, editingField, editValue);
            // Update local state
            setExtractedData((prev) => ({
                ...prev,
                [editingField]: { value: editValue, confidence: 1.0, corrected_by: 'user' },
            }));
            setEditingField(null);
            setEditValue('');
        } catch (err) {
            setErrorMessage(err.message);
        }
    };

    // ─── Reset ───
    const resetUpload = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        setUploadStatus('idle');
        setDocId(null);
        setExtractedData(null);
        setConfidenceColor(null);
        setOverallConfidence(null);
        setErrorMessage('');
        setConfirmResult(null);
        setSelectedFile(null);
        setFileName('');
        setRawText(null);
        setEditingField(null);
    };

    // ─── Build table rows from extracted data ───
    const buildRows = () => {
        if (!extractedData) return [];
        return Object.entries(extractedData)
            .filter(([, val]) => typeof val === 'object' && val !== null && 'value' in val)
            .map(([key, val]) => ({
                field: FIELD_LABELS[key] || key,
                fieldKey: key,
                value: val.value,
                displayValue: CURRENCY_FIELDS.has(key) && typeof val.value === 'number'
                    ? formatCurrency(val.value)
                    : String(val.value ?? '—'),
                confidence: val.confidence ?? 0,
            }));
    };

    const rows = buildRows();
    const isProcessing = uploadStatus === 'uploading' || uploadStatus === 'polling';

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Tax Documents</h2>
                <p className="text-gray-500 text-sm mb-6">Our AI will automatically extract numbers from Form 16, AIS, and Salary Slips.</p>

                {/* Doc type + financial year selectors */}
                {uploadStatus === 'idle' && (
                    <>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    id="doc-type-select"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    {DOC_TYPES.map((dt) => (
                                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                                <select
                                    id="financial-year-select"
                                    value={financialYear}
                                    onChange={(e) => setFinancialYear(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    {FINANCIAL_YEARS.map((fy) => (
                                        <option key={fy} value={fy}>{fy}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Drag & drop zone */}
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <UploadCloud className={cn("w-12 h-12 mb-4", dragActive ? "text-blue-500" : "text-gray-400")} />
                                <p className="font-semibold text-gray-900 mb-1">Drag & Drop Zone</p>
                                <p className="text-sm text-gray-500">or click to browse (PDF, JPG, PNG ≤10MB)</p>
                                <div className="mt-6 flex gap-2 justify-center">
                                    {DOC_TYPES.slice(0, 3).map((dt) => (
                                        <span key={dt.value} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{dt.label}</span>
                                    ))}
                                </div>
                            </label>
                        </div>
                    </>
                )}

                {/* Processing spinner */}
                {isProcessing && (
                    <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-semibold text-gray-900">Extracting Data...</p>
                        <p className="text-sm text-gray-500 mt-1">Gemini 1.5 Flash is reading your document</p>
                        {fileName && <p className="text-xs text-gray-400 mt-2">{fileName}</p>}
                    </div>
                )}

                {/* Error state */}
                {uploadStatus === 'failed' && (
                    <div className="border border-red-200 bg-red-50 rounded-xl p-8 text-center">
                        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="font-semibold text-red-900 mb-1">Extraction Failed</p>
                        <p className="text-sm text-red-700 mb-4">{errorMessage || 'An unknown error occurred.'}</p>
                        <button
                            onClick={resetUpload}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Extraction results */}
                {uploadStatus === 'complete' && rows.length > 0 && (
                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-emerald-100 px-6 py-4 flex items-center justify-between border-b border-emerald-200">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-700" />
                                <h3 className="font-semibold text-emerald-900">{fileName}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {overallConfidence !== null && (
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-1 rounded border",
                                        getConfidenceColor(overallConfidence)
                                    )}>
                                        {Math.round(overallConfidence * 100)}% overall
                                    </span>
                                )}
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200 px-2 py-1 rounded">Extraction Complete</span>
                            </div>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Extracted Field</th>
                                        <th className="p-4 font-semibold">Value</th>
                                        <th className="p-4 font-semibold">AI Confidence</th>
                                        <th className="p-4 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {rows.map((item) => (
                                        <tr key={item.fieldKey} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-900">{item.field}</td>
                                            <td className="p-4 text-sm font-semibold text-gray-900">
                                                {editingField === item.fieldKey ? (
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="border border-blue-300 rounded px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.displayValue
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold", getConfidenceColor(item.confidence))}>
                                                    {getConfidenceIcon(item.confidence)}
                                                    {Math.round(item.confidence * 100)}%
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {editingField === item.fieldKey ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={saveEdit} className="p-1 text-emerald-600 hover:text-emerald-800"><Check className="w-4 h-4" /></button>
                                                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => startEdit(item.fieldKey, item.value)}
                                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Please verify low-confidence fields before confirming.
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={resetUpload}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                >
                                    Confirm & Update Profile <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Raw text summary — show when available */}
                {uploadStatus === 'complete' && rawText && (
                    <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-6 mt-4">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Document Summary (Raw OCR Text)
                        </h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-4 border border-blue-100 max-h-64 overflow-auto font-mono leading-relaxed">
                            {rawText}
                        </pre>
                        {rows.length === 0 && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={resetUpload}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Upload Another
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty extraction and no raw text */}
                {uploadStatus === 'complete' && rows.length === 0 && !rawText && (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-8 text-center">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <p className="font-semibold text-amber-900 mb-1">No Data Extracted</p>
                        <p className="text-sm text-amber-700 mb-4">The AI couldn't extract any data from this document. Please check the file or try a different one.</p>
                        <button
                            onClick={resetUpload}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                        >
                            Upload Another
                        </button>
                    </div>
                )}

                {/* Confirming spinner */}
                {uploadStatus === 'confirming' && (
                    <div className="border border-blue-200 rounded-xl p-8 text-center bg-blue-50 flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                        <p className="font-semibold text-blue-900">Updating your financial profile...</p>
                    </div>
                )}

                {/* Confirmed success */}
                {uploadStatus === 'confirmed' && confirmResult && (
                    <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-8 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                        <p className="font-semibold text-emerald-900 mb-1">{confirmResult.message}</p>
                        {confirmResult.new_tax_liability !== undefined && (
                            <p className="text-sm text-emerald-700 mb-4">
                                Updated tax liability: <span className="font-bold">{formatCurrency(confirmResult.new_tax_liability)}</span>
                            </p>
                        )}
                        <button
                            onClick={resetUpload}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                            Upload Another Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
