import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Briefcase, Laptop, Building2, GraduationCap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';

const personas = [
    {
        id: 'salaried',
        icon: Briefcase,
        title: 'Salaried Employee',
        subtitle: 'I receive a salary and Form 16 from my employer',
        color: 'blue'
    },
    {
        id: 'freelancer',
        icon: Laptop,
        title: 'Freelancer / Gig Worker',
        subtitle: 'I earn through projects, invoices, or platforms',
        color: 'emerald'
    },
    {
        id: 'business',
        icon: Building2,
        title: 'Business Owner',
        subtitle: 'I run a business with revenue and expenses',
        color: 'purple'
    },
    {
        id: 'first_time',
        icon: GraduationCap,
        title: 'First-Time Filer',
        subtitle: 'This is my first time dealing with income tax',
        color: 'amber'
    }
];

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const navigate = useNavigate();

    const { updatePersona } = useAuth();
    const { setUserProfile } = useChat();

    // Step 2 — Income & Housing
    const [grossIncome, setGrossIncome] = useState('');
    const [basicSalary, setBasicSalary] = useState('');
    const [hraReceived, setHraReceived] = useState('');
    const [rentPaid, setRentPaid] = useState('');

    // Step 3 — Deductions
    const [sec80c, setSec80c] = useState('');
    const [sec80d, setSec80d] = useState('');
    const [otherDed, setOtherDed] = useState('');

    const handlePersonaSelect = (id) => {
        setSelectedPersona(id);
    };

    const nextStep = () => {
        if (step === 1 && selectedPersona) {
            updatePersona(selectedPersona);
            setStep(2);
        } else if (step === 2 && grossIncome) {
            setStep(3);
        } else if (step === 3) {
            // Compute totals
            const totalDeductions =
                (parseFloat(sec80c) || 0) +
                (parseFloat(sec80d) || 0) +
                (parseFloat(otherDed) || 0);

            const profile = {
                salary: grossIncome,
                basic_salary: basicSalary || null,
                hra_received: hraReceived || null,
                rent_paid: rentPaid || null,
                section_80c: sec80c || null,
                section_80d: sec80d || null,
                other_deductions: otherDed || null,
                deductions: totalDeductions.toString(),
                financial_year: 'FY 2024-25'
            };

            setUserProfile(profile);
            navigate('/dashboard');
        }
    };

    const stepLabels = ['Persona', 'Income', 'Deductions'];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 sm:px-6">
            {/* Header */}
            <div className="text-center mb-10 w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">AI Tax Copilot</h1>
                <p className="text-gray-500 text-lg">
                    {step === 1
                        ? "Let's personalize your tax experience"
                        : step === 2
                            ? "Tell us about your income"
                            : "Add your deductions"}
                </p>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    {stepLabels.map((label, idx) => {
                        const num = idx + 1;
                        return (
                            <div key={num} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                        step === num
                                            ? "bg-blue-600 text-white shadow-md"
                                            : step > num
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                    )}
                                >
                                    {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
                                </div>
                                <span className={cn("text-xs font-medium hidden sm:inline", step >= num ? "text-gray-900" : "text-gray-400")}>
                                    {label}
                                </span>
                                {idx < stepLabels.length - 1 && (
                                    <div className={cn("w-8 h-0.5 rounded-full", step > num ? "bg-blue-600" : "bg-gray-200")} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ===== STEP 1: PERSONA ===== */}
            {step === 1 && (
                <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        {personas.map((p) => {
                            const Icon = p.icon;
                            const isSelected = selectedPersona === p.id;

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handlePersonaSelect(p.id)}
                                    className={cn(
                                        "text-left p-6 rounded-2xl border-2 transition-all relative overflow-hidden group",
                                        isSelected
                                            ? "border-blue-500 bg-blue-50/30 shadow-sm"
                                            : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-blue-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                        isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <h3 className={cn("text-lg font-semibold mb-2", isSelected ? "text-blue-900" : "text-gray-900")}>
                                        {p.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {p.subtitle}
                                    </p>

                                    {isSelected && (
                                        <div className="absolute top-6 right-6 text-blue-600 animate-in zoom-in duration-200">
                                            <CheckCircle2 className="w-6 h-6 fill-blue-100" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            disabled={!selectedPersona}
                            onClick={nextStep}
                            className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-medium text-lg w-full max-w-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            Continue &rarr;
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="text-gray-400 text-sm hover:text-gray-600 font-medium">
                            Skip — I'll figure it out myself
                        </button>
                    </div>
                </div>
            )}

            {/* ===== STEP 2: INCOME & HOUSING ===== */}
            {step === 2 && (
                <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Income & Housing</h2>
                            <p className="text-gray-500 text-sm">We need these to calculate your tax under both regimes and HRA exemption.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Gross Income (₹) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={grossIncome}
                                    onChange={(e) => setGrossIncome(e.target.value)}
                                    placeholder="e.g. 15,00,000"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Basic Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={basicSalary}
                                        onChange={(e) => setBasicSalary(e.target.value)}
                                        placeholder="e.g. 6,00,000"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Needed for HRA calculation</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual HRA Received (₹)</label>
                                    <input
                                        type="number"
                                        value={hraReceived}
                                        onChange={(e) => setHraReceived(e.target.value)}
                                        placeholder="e.g. 3,00,000"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">From your pay slip</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Rent Paid (₹)</label>
                                <input
                                    type="number"
                                    value={rentPaid}
                                    onChange={(e) => setRentPaid(e.target.value)}
                                    placeholder="e.g. 2,40,000 (Leave blank if none)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={!grossIncome}
                                className="bg-blue-600 text-white rounded-xl px-8 py-3 font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Next: Deductions &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STEP 3: DEDUCTIONS ===== */}
            {step === 3 && (
                <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deductions & Investments</h2>
                            <p className="text-gray-500 text-sm">Add your tax-saving investments. These determine which regime is better for you.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Section 80C — PPF, ELSS, LIC, EPF (₹)
                                    <span className="text-xs text-gray-400 ml-2">Max ₹1,50,000</span>
                                </label>
                                <input
                                    type="number"
                                    value={sec80c}
                                    onChange={(e) => setSec80c(e.target.value)}
                                    placeholder="e.g. 150000"
                                    max={150000}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Section 80D — Health Insurance (₹)
                                    <span className="text-xs text-gray-400 ml-2">Max ₹25,000 (₹50,000 for senior)</span>
                                </label>
                                <input
                                    type="number"
                                    value={sec80d}
                                    onChange={(e) => setSec80d(e.target.value)}
                                    placeholder="e.g. 25000"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Other Deductions — NPS 80CCD(1B), 80G, etc. (₹)
                                </label>
                                <input
                                    type="number"
                                    value={otherDed}
                                    onChange={(e) => setOtherDed(e.target.value)}
                                    placeholder="e.g. 50000 (Leave blank if none)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Live Summary */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Quick Summary</p>
                                <div className="flex justify-between text-sm text-blue-800">
                                    <span>Gross Income</span>
                                    <span className="font-medium">₹{parseInt(grossIncome || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm text-blue-800 mt-1">
                                    <span>Total Deductions</span>
                                    <span className="font-medium">
                                        ₹{((parseFloat(sec80c) || 0) + (parseFloat(sec80d) || 0) + (parseFloat(otherDed) || 0)).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="bg-blue-600 text-white rounded-xl px-8 py-3 font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                Complete Profile & Goto Dashboard &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
