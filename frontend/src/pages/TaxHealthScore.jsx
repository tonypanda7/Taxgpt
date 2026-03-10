import { ArrowRight, CheckCircle2, AlertCircle, FileText, Zap } from 'lucide-react';
import HealthGauge from '../components/HealthGauge';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';

export default function TaxHealthScore() {
    const score = 72;

    const factors = [
        {
            id: 1,
            title: 'Deductions Utilised',
            weight: '30%',
            status: 'warning',
            message: 'You have ₹82,800 in unused deduction capacity.',
            action: 'Optimize Deductions',
            link: '/deductions',
            impact: '+15 points'
        },
        {
            id: 2,
            title: 'Advance Tax Compliance',
            weight: '25%',
            status: 'good',
            message: 'You are on track with your quarterly installments.',
            action: 'View Schedule',
            link: '/advance-tax',
            impact: null
        },
        {
            id: 3,
            title: 'Document Completeness',
            weight: '20%',
            status: 'warning',
            message: 'AIS not uploaded. We need this to verify TDS.',
            action: 'Upload AIS',
            link: '/documents',
            impact: '+8 points'
        },
        {
            id: 4,
            title: 'Regime Optimality',
            weight: '15%',
            status: 'good',
            message: 'You are using the optimal New Regime.',
            action: 'View Comparison',
            link: '/regime-comparison',
            impact: null
        },
        {
            id: 5,
            title: 'Profile Completeness',
            weight: '10%',
            status: 'good',
            message: 'All core tax profile fields are filled.',
            action: 'Edit Profile',
            link: '/chat',
            impact: null
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
                <div className="shrink-0">
                    <HealthGauge score={score} label="Good" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Your Tax Health is Good</h1>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Your score indicates that you are mostly compliant, but you're leaving money on the table. By taking a few actions, you could increase your score to 95 and save up to ₹48,000 in taxes.
                    </p>
                    <div className="flex gap-3">
                        <Link to="/deductions" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Start Optimizing
                        </Link>
                    </div>
                </div>
            </div>

            {/* Breakdown List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {factors.map((factor) => (
                        <div key={factor.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">

                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-2 rounded-full mt-1",
                                    factor.status === 'good' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                )}>
                                    {factor.status === 'good' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900">{factor.title}</h3>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            Weight: {factor.weight}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{factor.message}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 sm:ml-auto pl-12 sm:pl-0">
                                {factor.impact && (
                                    <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                                        {factor.impact}
                                    </span>
                                )}
                                <Link
                                    to={factor.link}
                                    className={cn(
                                        "text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap",
                                        factor.status === 'good'
                                            ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                    )}
                                >
                                    {factor.action}
                                </Link>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
