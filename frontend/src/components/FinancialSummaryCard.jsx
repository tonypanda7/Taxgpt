import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { cn } from '../utils/cn';
import { CheckCircle2, Edit2, History, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function FinancialSummaryCard({ showOldRegime = false, onToggleRegime }) {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await api.tax.getComparison();
                setSummaryData(data);
            } catch (error) {
                console.error("Failed to load financial summary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-[500px] sticky top-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-500">Loading Profile...</p>
            </div>
        );
    }

    if (!summaryData) {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 text-center h-[500px] sticky top-6">
                <p className="text-sm font-medium text-gray-500">Please complete onboarding to generate your profile.</p>
            </div>
        );
    }

    const { old_regime, new_regime } = summaryData;
    // We assume gross income is taxable + deductions for display purposes
    const grossIncome = old_regime.taxable_income + old_regime.deductions_applied + old_regime.standard_deduction;

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full sticky top-6">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Financial Summary
                </h3>
                <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <History className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Income Section */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Income</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center group cursor-pointer">
                            <span className="text-sm text-gray-600">Gross Salary</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{formatCurrency(grossIncome)}</span>
                                <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center group cursor-pointer">
                            <span className="text-sm text-gray-600">Other Income</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{formatCurrency(0)}</span>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deductions Section */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deductions (Old Regime)</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center group cursor-pointer">
                            <span className="text-sm text-gray-600">Standard Deduction</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(old_regime.standard_deduction)}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center group cursor-pointer">
                            <span className="text-sm text-gray-600">Other Deductions</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(old_regime.deductions_applied)}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calculation Box */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Taxable Income</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(showOldRegime ? old_regime.taxable_income : new_regime.taxable_income)}</span>
                    </div>
                    <div className="w-full h-px bg-gray-200 my-3"></div>

                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-xs font-medium text-gray-500 block mb-1">
                                {showOldRegime ? 'Old Regime Tax' : 'New Regime Tax'}
                            </span>
                            <span className={cn(
                                "text-2xl font-bold tracking-tight",
                                (!showOldRegime && new_regime.total_tax < old_regime.total_tax) || (showOldRegime && old_regime.total_tax < new_regime.total_tax)
                                    ? "text-emerald-600"
                                    : "text-gray-900"
                            )}>
                                {formatCurrency(showOldRegime ? old_regime.total_tax : new_regime.total_tax)}
                            </span>
                        </div>

                        {!showOldRegime && new_regime.total_tax < old_regime.total_tax && (
                            <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
                                Saves {formatCurrency(old_regime.total_tax - new_regime.total_tax)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Toggle */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">Show Old Regime Tax</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={showOldRegime}
                            onChange={onToggleRegime}
                        />
                        <div className={cn(
                            "block w-10 h-6 rounded-full transition-colors",
                            showOldRegime ? "bg-blue-600" : "bg-gray-300"
                        )}></div>
                        <div className={cn(
                            "dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform",
                            showOldRegime ? "transform translate-x-4" : ""
                        )}></div>
                    </div>
                </label>
            </div>
        </div>
    );
}
