import { CheckCircle2, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';

export default function AdvanceTax() {
    const totalTax = 114100;

    const schedule = [
        { id: 1, date: 'Jun 15, 2024', percentage: 15, amount: totalTax * 0.15, status: 'paid' },
        { id: 2, date: 'Sep 15, 2024', percentage: 45, amount: totalTax * 0.45, status: 'paid' },
        { id: 3, date: 'Dec 15, 2024', percentage: 75, amount: totalTax * 0.75, status: 'due', dueInDays: 12 },
        { id: 4, date: 'Mar 15, 2025', percentage: 100, amount: totalTax * 1.0, status: 'upcoming' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Advance Tax Schedule</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-8">
                    Your total estimated tax is {formatCurrency(totalTax)}. Because it exceeds ₹10,000, you are required to pay it in 4 quarterly installments to avoid Section 234C interest penalties.
                </p>

                {/* Vertical Timeline for Mobile, Horizontal for Desktop */}
                <div className="relative mt-12 mb-8 hidden md:block">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0"></div>
                    <div className="absolute top-1/2 left-[12.5%] w-[50%] h-1 bg-blue-600 -translate-y-1/2 rounded-full z-0"></div>

                    <div className="grid grid-cols-4 gap-4 relative z-10">
                        {schedule.map((node) => (
                            <div key={node.id} className="flex flex-col items-center">
                                {/* Status Dot */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-4 transition-colors",
                                    node.status === 'paid' ? "bg-blue-600 text-white" :
                                        node.status === 'due' ? "bg-amber-500 text-white animate-pulse" :
                                            "bg-gray-200 text-transparent"
                                )}>
                                    {node.status === 'paid' && <CheckCircle2 className="w-4 h-4" />}
                                    {node.status === 'due' && <Clock className="w-4 h-4" />}
                                </div>

                                <p className="text-sm font-semibold text-gray-900">{node.date}</p>
                                <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider my-1">
                                    Cumulative {node.percentage}%
                                </div>
                                <p className={cn(
                                    "text-lg font-bold tracking-tight",
                                    node.status === 'paid' ? "text-gray-900" :
                                        node.status === 'due' ? "text-amber-600" :
                                            "text-gray-400"
                                )}>
                                    {formatCurrency(node.amount)}
                                </p>

                                {node.status === 'paid' && (
                                    <span className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                    </span>
                                )}
                                {node.status === 'due' && (
                                    <button className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                        Mark as Paid
                                    </button>
                                )}
                                {node.status === 'upcoming' && (
                                    <span className="text-xs text-gray-400 mt-2">Upcoming</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile View Timeline (Vertical list) */}
                <div className="md:hidden space-y-4 text-left border-l-2 border-gray-100 ml-4 pb-4">
                    {schedule.map((node) => (
                        <div key={node.id} className="relative pl-6">
                            <div className={cn(
                                "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white",
                                node.status === 'paid' ? "bg-blue-600" :
                                    node.status === 'due' ? "bg-amber-500" :
                                        "bg-gray-200"
                            )}></div>
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-gray-900">{node.date}</span>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded uppercase",
                                        node.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                            node.status === 'due' ? "bg-amber-100 text-amber-700" :
                                                "bg-gray-200 text-gray-600"
                                    )}>
                                        {node.status}
                                    </span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-2">{formatCurrency(node.amount)}</div>
                                <p className="text-xs text-gray-500">Must pay cumulative {node.percentage}% by this date.</p>

                                {node.status === 'due' && (
                                    <button className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors text-center">
                                        Mark as Paid
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
                <div className="bg-white rounded-full p-2 h-fit shrink-0 border border-blue-100">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Section 234C Interest Penalty</h3>
                    <p className="text-sm text-blue-800">If you miss an installment or pay less than the required percentage, a 1% per month interest penalty is levied on the shortfall amount. Stay on track to avoid extra fees.</p>
                </div>
            </div>
        </div>
    );
}
