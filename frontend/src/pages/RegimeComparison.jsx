import { ShieldCheck, ArrowRight, Info, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';

export default function RegimeComparison() {
    const data = {
        gross: 1500000,
        old: {
            stdDed: 50000,
            deductions: 175000, // 1.5L 80C + 25K 80D
            taxable: 1275000,
            baseTax: 125000,
            cess: 5000,
            totalTax: 130000,
            effectiveRate: 8.6
        },
        new: {
            stdDed: 75000,
            deductions: 0,
            taxable: 1425000,
            baseTax: 110000,
            cess: 4400,
            totalTax: 114400,
            effectiveRate: 7.6
        }
    };

    const savings = data.old.totalTax - data.new.totalTax;
    const winner = savings > 0 ? 'new' : 'old';

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Hero Recommendation */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 bg-emerald-500/30 w-fit px-3 py-1 rounded-full border border-emerald-400/30">
                            <ShieldCheck className="w-4 h-4 text-emerald-100" />
                            <span className="text-sm font-semibold text-emerald-50 tracking-wide uppercase">AI Recommendation</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            The {winner === 'new' ? 'New' : 'Old'} Regime saves you {formatCurrency(Math.abs(savings))}
                        </h1>
                        <p className="text-emerald-100 max-w-2xl text-sm leading-relaxed">
                            Your current deductions ({formatCurrency(data.old.deductions)}) aren't enough to offset the lower tax slabs and higher standard deduction under the new regime.
                        </p>
                    </div>
                    <button className="bg-white text-emerald-800 font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0">
                        Apply to Profile <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Side-by-Side Comparison Panel (PRD Component 2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Old Regime Card */}
                <div className={cn(
                    "bg-white rounded-2xl border-2 p-6 transition-all",
                    winner === 'old' ? "border-emerald-500 shadow-emerald-100 shadow-lg" : "border-gray-100 shadow-sm opacity-80"
                )}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Old Regime</h2>
                        {winner === 'old' && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">WINNER ✅</span>}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500">Gross Income</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.gross)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-1 cursor-help" title="Standard Deduction for Salaried"><Info className="w-3.5 h-3.5" /> Std. Deduction</span>
                            <span className="font-medium text-red-600">-{formatCurrency(data.old.stdDed)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500">Chapter VI-A Deductions</span>
                            <span className="font-medium text-red-600">-{formatCurrency(data.old.deductions)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="font-semibold text-gray-900">Taxable Income</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(data.old.taxable)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100 pt-2">
                            <span className="text-gray-500">Base Tax</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.old.baseTax)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500">Health & Education Cess (4%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.old.cess)}</span>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100 font-mono">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-sans mb-1">Total Tax</p>
                                <p className={cn("text-2xl font-bold tracking-tight", winner === 'old' ? "text-emerald-600" : "text-gray-900")}>
                                    {formatCurrency(data.old.totalTax)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-sans mb-1">Effective Rate</p>
                                <p className="text-lg font-semibold text-gray-700">{data.old.effectiveRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Regime Card */}
                <div className={cn(
                    "bg-white rounded-2xl border-2 p-6 transition-all",
                    winner === 'new' ? "border-emerald-500 shadow-emerald-100 shadow-lg" : "border-gray-100 shadow-sm opacity-80"
                )}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">New Regime <span className="text-xs font-normal text-gray-400 ml-2">(Default)</span></h2>
                        {winner === 'new' && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">WINNER</span>}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500">Gross Income</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.gross)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-1 cursor-help" title="Budget 2024 increased this to ₹75,000"><Info className="w-3.5 h-3.5" /> Std. Deduction</span>
                            <span className="font-medium text-red-600">-{formatCurrency(data.new.stdDed)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500 line-through">Chapter VI-A Deductions</span>
                            <span className="font-medium text-gray-400">Not Allowed</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="font-semibold text-gray-900">Taxable Income</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(data.new.taxable)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100 pt-2">
                            <span className="text-gray-500">Base Tax</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.new.baseTax)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-gray-100">
                            <span className="text-gray-500">Health & Education Cess (4%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(data.new.cess)}</span>
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100 font-mono">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-sans mb-1">Total Tax</p>
                                <p className={cn("text-2xl font-bold tracking-tight", winner === 'new' ? "text-emerald-600" : "text-gray-900")}>
                                    {formatCurrency(data.new.totalTax)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-sans mb-1">Effective Rate</p>
                                <p className="text-lg font-semibold text-gray-700">{data.new.effectiveRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Breakeven Analysis */}
            {winner === 'new' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-amber-900 font-bold mb-1 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 fill-amber-300" /> Breakeven Analysis
                        </h3>
                        <p className="text-amber-800 text-sm">
                            If you invest an additional <strong className="font-mono bg-amber-100 px-1 rounded">₹75,000</strong> in eligible deductions (like NPS or 80D), the Old Regime will become more beneficial.
                        </p>
                    </div>
                    <button className="bg-white text-amber-700 border border-amber-300 px-4 py-2 font-semibold text-sm rounded-lg hover:bg-amber-100 transition-colors shrink-0 whitespace-nowrap">
                        Find Deductions
                    </button>
                </div>
            )}

        </div>
    );
}

import { Lightbulb } from 'lucide-react';
