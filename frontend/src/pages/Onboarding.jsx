import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // Step 2 state
    const [salary, setSalary] = useState('');
    const [rent, setRent] = useState(null);

    const handlePersonaSelect = (id) => {
        setSelectedPersona(id);
    };

    const nextStep = () => {
        if (step === 1 && selectedPersona) setStep(2);
        else if (step === 2) navigate('/dashboard');
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
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-8 duration-500">

                    {/* Chat Interface */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">

                            {/* Message 1 */}
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">🤖</div>
                                <div className="bg-gray-50 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed">
                                    Great! Since you're salaried, let's start with your annual gross salary. You can type the amount or pick a range.
                                </div>
                            </div>

                            {/* User Reply 1 */}
                            {!salary ? (
                                <div className="pl-12 flex flex-wrap gap-2 animate-in fade-in duration-300">
                                    {['₹5L - ₹8L', '₹8L - ₹12L', '₹12L - ₹20L', '₹20L+'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setSalary(range)}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            {range}
                                        </button>
                                    ))}
                                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300">Type exact amount</button>
                                </div>
                            ) : (
                                <div className="flex gap-4 justify-end">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                                        {salary}
                                    </div>
                                </div>
                            )}

                            {/* Message 2 */}
                            {salary && (
                                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">🤖</div>
                                    <div className="bg-gray-50 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed">
                                        Got it — {salary}. Do you pay rent? This helps us check if you can claim HRA.
                                    </div>
                                </div>
                            )}

                            {/* User Reply 2 */}
                            {salary && rent === null && (
                                <div className="pl-12 flex flex-wrap gap-2 animate-in fade-in duration-300">
                                    <button onClick={() => setRent('Yes, I pay rent')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">Yes, I pay rent</button>
                                    <button onClick={() => setRent('No, I own a house')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">No, I own a house</button>
                                    <button onClick={() => setRent('I live with parents')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">I live with parents</button>
                                </div>
                            )}

                            {rent && (
                                <div className="flex gap-4 justify-end">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                                        {rent}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Simulated Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-5 pr-12 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-shadow"
                                    disabled={!rent}
                                />
                                <button
                                    onClick={nextStep}
                                    disabled={!rent}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    &rarr;
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                        <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            Your Profile So Far
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                                <span className="text-gray-500">Persona</span>
                                <span className="font-medium text-gray-900 flex items-center gap-1.5">Salaried <CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                            </div>

                            <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                                <span className="text-gray-500">Gross Salary</span>
                                {salary ? (
                                    <span className="font-medium text-gray-900 flex items-center gap-1.5">{salary} <CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                                ) : (
                                    <span className="text-gray-400 flex items-center gap-1.5">Awaiting... <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /></span>
                                )}
                            </div>

                            <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                                <span className="text-gray-500">Pays Rent</span>
                                {rent ? (
                                    <span className="font-medium text-gray-900 flex items-center gap-1.5">{rent.split(',')[0]} <CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                                ) : (
                                    <span className="text-gray-400">Not asked yet</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Investments</span>
                                <span className="text-gray-400">Not asked yet</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                <span>Profile Completeness</span>
                                <span className="text-blue-600">{rent ? '60%' : salary ? '40%' : '20%'}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: rent ? '60%' : salary ? '40%' : '20%' }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
