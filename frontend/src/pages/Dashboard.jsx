import { Link } from 'react-router-dom';
import { Lightbulb, Info, FileText, ArrowRight, ShieldCheck, Zap, Activity, Calendar } from 'lucide-react';
import HealthGauge from '../components/HealthGauge';
import DeductionGapBar from '../components/DeductionGapBar';

export default function Dashboard() {
    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Top Hero Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tax Health Score */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400"></div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 w-full text-center">Tax Health Score</h2>
                    <HealthGauge
                        score={72}
                        label="Good"
                        subtitle="Improve by ₹48,000 with 3 actions"
                    />
                </div>

                {/* Regime Recommendation */}
                <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 to-indigo-900 p-8 rounded-2xl shadow-sm text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>

                    <div className="flex items-start gap-3 mb-2">
                        <div className="bg-emerald-400/20 text-emerald-300 p-1.5 rounded-full mt-1">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-1">New Regime saves you ₹23,400</h2>
                            <p className="text-blue-200">Based on your current salary and declared deductions.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-end gap-8">
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2 text-blue-200">
                                <span>Old Regime</span>
                                <span className="font-medium text-white opacity-60">₹1,37,500</span>
                            </div>
                            <div className="w-full h-3 bg-blue-950/50 rounded-full overflow-hidden">
                                <div className="bg-blue-300 h-full w-[85%] rounded-full opacity-60"></div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2 font-medium text-emerald-300">
                                <span>New Regime</span>
                                <span className="text-white">₹1,14,100</span>
                            </div>
                            <div className="w-full h-4 bg-emerald-950/50 rounded-full overflow-hidden shadow-inner flex items-center p-0.5">
                                <div className="bg-emerald-400 h-full w-[70%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Tax Savings (Niche Suggestions) */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-amber-500 fill-amber-100" />
                    Hidden Tax Savings You're Missing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors cursor-pointer">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900 text-base">Section 80D <span className="text-gray-500 font-normal">— Checkup</span></h3>
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Tier 1</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 h-16">Get a preventive health checkup and save ₹1,560. Most people miss this ₹5,000 deduction.</p>
                        <button className="text-emerald-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Claim Now <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900 text-base">Section 80CCD(2) <span className="text-gray-500 font-normal">— NPS</span></h3>
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Tier 1</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 h-16">Ask HR to opt into employer NPS contribution. Save up to ₹15,600/year under both regimes.</p>
                        <button className="text-blue-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Learn More <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors cursor-pointer">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900 text-base">Section 80EEB <span className="text-gray-500 font-normal">— EV Loan</span></h3>
                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Tier 2</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 h-16">If you bought an electric vehicle on loan, claim ₹1,50,000 interest deduction.</p>
                        <button className="text-purple-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Check Eligibility <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Deadlines */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            Upcoming Deadlines
                        </h3>
                        <Link to="/advance-tax" className="text-sm text-blue-600 font-medium hover:underline">View Calendar</Link>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">15</div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Advance Tax Q3</p>
                                    <p className="text-xs text-gray-500">Dec 15, 2024</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-full shadow-sm">
                                In 9 months
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">15</div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Investment Proofs</p>
                                    <p className="text-xs text-gray-500">Jan 15, 2025</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold shrink-0">31</div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">ITR Filing</p>
                                    <p className="text-xs text-gray-500">Jul 31, 2025</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deduction Utilisation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            Deduction Utilisation
                        </h3>
                        <Link to="/deductions" className="text-sm text-blue-600 font-medium hover:underline">Optimize</Link>
                    </div>

                    <DeductionGapBar
                        section="80C"
                        title="EPF, ELSS, PPF, Life Insurance"
                        used={120000}
                        limit={150000}
                        savingPotential={9360}
                    />
                    <DeductionGapBar
                        section="80D"
                        title="Medical Insurance"
                        used={0}
                        limit={25000}
                        savingPotential={7800}
                    />
                    <DeductionGapBar
                        section="80CCD(1B)"
                        title="Additional NPS"
                        used={0}
                        limit={50000}
                        savingPotential={15600}
                    />
                </div>

            </div>
        </div>
    );
}


