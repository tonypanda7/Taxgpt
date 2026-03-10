import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Edit2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';

export default function Documents() {
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, complete

    // Mock extracted data
    const extractedData = [
        { field: 'Employer Name', value: 'Infosys Ltd', confidence: 0.98 },
        { field: 'Gross Salary', value: formatCurrency(1500000), confidence: 0.95 },
        { field: 'Standard Deduction', value: formatCurrency(50000), confidence: 0.92 },
        { field: 'TDS Deducted', value: formatCurrency(180000), confidence: 0.72 },
        { field: '80C Investments', value: formatCurrency(120000), confidence: 0.45 },
    ];

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            simulateUpload();
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            simulateUpload();
        }
    };

    const simulateUpload = () => {
        setUploadStatus('uploading');
        setTimeout(() => {
            setUploadStatus('complete');
        }, 2000);
    };

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

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Tax Documents</h2>
                <p className="text-gray-500 text-sm mb-6">Our AI will automatically extract numbers from Form 16, AIS, and Salary Slips.</p>

                {uploadStatus === 'idle' && (
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
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Form 16</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">AIS</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Salary Slip</span>
                            </div>
                        </label>
                    </div>
                )}

                {uploadStatus === 'uploading' && (
                    <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-semibold text-gray-900">Extracting Data...</p>
                        <p className="text-sm text-gray-500 mt-1">Gemini 1.5 Flash is reading your document</p>
                    </div>
                )}

                {uploadStatus === 'complete' && (
                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-emerald-100 px-6 py-4 flex items-center justify-between border-b border-emerald-200">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-700" />
                                <h3 className="font-semibold text-emerald-900">form16_2024.pdf</h3>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200 px-2 py-1 rounded">Extraction Complete</span>
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
                                    {extractedData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-900">{item.field}</td>
                                            <td className="p-4 text-sm font-semibold text-gray-900">{item.value}</td>
                                            <td className="p-4">
                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold", getConfidenceColor(item.confidence))}>
                                                    {getConfidenceIcon(item.confidence)}
                                                    {Math.round(item.confidence * 100)}%
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </button>
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
                                    onClick={() => setUploadStatus('idle')}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                                    Confirm & Update Profile <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mismatch Alert (Mock) */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
                <div className="bg-white rounded-full p-2 h-fit shrink-0 border border-amber-100">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-amber-900 mb-1">TDS Mismatch Detected</h3>
                    <p className="text-sm text-amber-800 mb-3">Your uploaded Form 16 shows ₹1,80,000 TDS, but your AIS shows ₹1,75,000. This might cause issues during filing.</p>
                    <button className="text-sm font-semibold text-amber-700 bg-white border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                        See Details & Resolve
                    </button>
                </div>
            </div>

        </div>
    );
}
