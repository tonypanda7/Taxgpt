import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Briefcase, Laptop, Building2, GraduationCap, CheckCircle2 } from 'lucide-react';
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
    const { userProfile, setUserProfile } = useChat();

    // Step 2 state
    const [salary, setSalary] = useState('');
    const [rent, setRent] = useState(null);

    const handlePersonaSelect = (id) => {
        setSelectedPersona(id);
    };

    const nextStep = () => {
        if (step === 1 && selectedPersona) {
            updatePersona(selectedPersona);
            setStep(2);
        }
        else if (step === 2) {
            setUserProfile({
                ...userProfile,
                gross_income: salary,
                rent_paid: rent
            });
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 sm:px-6">
            {/* Header */}
            <div className="text-center mb-10 w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">AI Tax Copilot</h1>
                <p className="text-gray-500 text-lg">
                    {step === 1 ? "Let's personalize your tax experience" : "Let's build your tax profile"}
                </p>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    {[1, 2, 3].map((num) => (
                        <div
                            key={num}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                step === num ? "bg-blue-600 w-6" : step > num ? "bg-blue-600" : "bg-gray-200"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            {step === 1 ? (
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
            ) : (
                <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Build Your Financial Profile</h2>
                            <p className="text-gray-500 text-sm">Tell us a bit about your finances so we can personalize our tax advice.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Gross Income (₹)</label>
                                <input
                                    type="number"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    placeholder="e.g. 1500000"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Rent Paid (₹)</label>
                                <input
                                    type="number"
                                    value={rent === null ? '' : rent}
                                    onChange={(e) => setRent(e.target.value)}
                                    placeholder="e.g. 240000 (Leave blank if none)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Deductions (80C, 80D, NPS, etc.) (₹)</label>
                                <input
                                    type="number"
                                    value={userProfile?.deductions || ''}
                                    onChange={(e) => setUserProfile({ ...userProfile, deductions: e.target.value })}
                                    placeholder="e.g. 150000 (Leave blank if none)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <button
                                onClick={nextStep}
                                disabled={!salary}
                                className="w-full bg-blue-600 text-white rounded-xl py-3.5 mt-4 font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
