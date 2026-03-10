import { TrendingUp, PieChart, Activity } from 'lucide-react';
import DeductionGapBar from '../components/DeductionGapBar';

export default function Deductions() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Deduction Optimizer</h1>
                    <p className="text-gray-500">Find and maximize every tax-saving opportunity legally available to you.</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Main Gaps Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        Your Utilisation Gaps
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <DeductionGapBar
                            section="80C"
                            title="EPF, ELSS, PPF, Life Insurance"
                            used={120000}
                            limit={150000}
                            savingPotential={9360}
                        />
                        <DeductionGapBar
                            section="80D"
                            title="Medical Insurance (Self & Family)"
                            used={0}
                            limit={25000}
                            savingPotential={7800}
                        />
                        <DeductionGapBar
                            section="80CCD(1B)"
                            title="Additional Tier 1 NPS Contribution"
                            used={0}
                            limit={50000}
                            savingPotential={15600}
                        />
                        <DeductionGapBar
                            section="80TTA/TTB"
                            title="Savings Account Interest"
                            used={2500}
                            limit={10000}
                            savingPotential={0} // too small or user doesn't have more interest
                        />
                    </div>
                </div>

                {/* 80C Deep Dive */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-blue-500" />
                        Your 80C Portfolio
                    </h2>

                    <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                        {/* Extremely simple CSS conic-gradient "pie chart" for mock purposes */}
                        <div
                            className="w-full h-full rounded-full"
                            style={{
                                background: `conic-gradient(
                  #3b82f6 0% 60%, 
                  #10b981 60% 80%, 
                  #f3f4f6 80% 100%
                )`
                            }}
                        />
                        <div className="absolute w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                                80%
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Utilised</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                                <span className="text-gray-700">EPF (Employer)</span>
                            </div>
                            <span className="font-semibold">₹90,000</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                                <span className="text-gray-700">ELSS Mutual Funds</span>
                            </div>
                            <span className="font-semibold">₹30,000</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></span>
                                <span className="text-gray-500 font-medium">Unused Capacity</span>
                            </div>
                            <span className="font-semibold text-emerald-600">₹30,000</span>
                        </div>
                    </div>
                </div>

                {/* NPS Recommendation */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Top Recommendation</span>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Automate your NPS</h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            You haven't used your Section 80CCD(1B) deduction. This is an extra ₹50,000 limit over and above 80C.
                        </p>
                        <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm mb-6">
                            <p className="text-sm text-gray-600 mb-1">To max this out, invest:</p>
                            <p className="text-2xl font-bold text-indigo-600 font-mono tracking-tight">₹4,167 <span className="text-sm text-gray-400 font-sans font-normal">/ month</span></p>
                        </div>
                    </div>
                    <button className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
                        Learn How to Setup SIP
                    </button>
                </div>

            </div>
        </div>
    );
}
