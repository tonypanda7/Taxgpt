import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Mic, BookOpen, ThumbsUp, ThumbsDown, User, Bot, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import FinancialSummaryCard from '../components/FinancialSummaryCard';
import CitationDrawer from '../components/CitationDrawer';
import { formatCurrency } from '../utils/formatCurrency';

// Mock messages for UI layout
const INITIAL_MESSAGES = [
    {
        id: 1,
        role: 'assistant',
        text: "Hi Rahul! I'm your AI Tax Copilot. I see your profile is set up as a Salaried Employee with ₹15L gross income. How can I help you save tax today?",
        time: "10:00 AM",
    },
    {
        id: 2,
        role: 'user',
        text: "Should I claim HRA or buy a house on EMI to save more?",
        time: "10:02 AM",
    },
    {
        id: 3,
        role: 'assistant',
        text: "That’s a great question. Since your rent is currently ₹20,000/month, your HRA exemption is limited to ₹1.2L annually.\n\nIf you buy a house on EMI (say, a ₹50L loan at 8.5%), you can claim up to ₹2L in interest deduction under Section 24B. This would reduce your total tax from ₹1.14L to ₹95,000.\n\nHowever, remember that home ownership comes with other costs. Want me to run a detailed comparison?",
        time: "10:03 AM",
        citations: [
            { section: "Section 24(B)", text: "Deduction of up to ₹2,00,000 is allowed on interest paid for a self-occupied property loan.", fy: "FY 2024-25", link: "#" },
            { section: "Section 10(13A)", text: "HRA exemption is the least of: actual HRA, 50% basic (metro) or rent paid minus 10% basic salary.", fy: "FY 2024-25", link: "#" }
        ]
    }
];

export default function Chat() {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [showOldRegime, setShowOldRegime] = useState(false);
    const [citationDrawerOpen, setCitationDrawerOpen] = useState(false);
    const [activeCitations, setActiveCitations] = useState([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add user message
        const newMsg = {
            id: Date.now(),
            role: 'user',
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: "I've analyzed that scenario. Let me explain how it impacts your taxable income.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 2000);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const openCitations = (citations) => {
        setActiveCitations(citations);
        setCitationDrawerOpen(true);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

            {/* Chat Area (Left/Main) */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="text-center pb-4">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            Today
                        </span>
                    </div>

                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>

                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                msg.role === 'user' ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-600"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                            </div>

                            {/* Message Bubble container */}
                            <div className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white rounded-tr-sm"
                                        : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
                                )}>
                                    {/* Handle newlines in text */}
                                    {msg.text.split('\n').map((line, i) => (
                                        <span key={i} className="block min-h-[1em]">{line}</span>
                                    ))}

                                    {/* Smart Actions / Citations (Only for AI) */}
                                    {msg.role === 'assistant' && msg.citations && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center justify-between">
                                            <button
                                                onClick={() => openCitations(msg.citations)}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-100 px-2 py-1 rounded"
                                            >
                                                <BookOpen className="w-3.5 h-3.5" />
                                                View Law Citations ({msg.citations.length})
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button className="text-gray-400 hover:text-emerald-600 transition-colors" title="Helpful">
                                                    <ThumbsUp className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-red-600 transition-colors" title="Not helpful">
                                                    <ThumbsDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-4 max-w-3xl">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-6 pb-2 pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {["Compare regimes", "What if I invest ₹50K in NPS?", "Explain Advance Tax", "Upload Form 16"].map(chip => (
                        <button
                            key={chip}
                            onClick={() => setInputValue(chip)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors flex-shrink-0"
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
                    <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-sm inset-y-0">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg flex-shrink-0">
                            <Upload className="w-5 h-5" />
                        </button>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about your taxes or numbers..."
                            className="w-full bg-transparent border-none py-2.5 px-0 text-sm focus:outline-none focus:ring-0 resize-none max-h-32 min-h-11"
                            rows={1}
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <p className="text-[10px] text-gray-400">AI can make mistakes. All calculations are double-checked by our deterministic tax engine.</p>
                    </div>
                </div>

            </div>

            {/* Right Sidebar - Financial Summary */}
            <div className="hidden lg:block w-80 flex-shrink-0 relative">
                <FinancialSummaryCard
                    showOldRegime={showOldRegime}
                    onToggleRegime={() => setShowOldRegime(!showOldRegime)}
                />
            </div>

            {/* Slide-out Citation Drawer */}
            <CitationDrawer
                isOpen={citationDrawerOpen}
                onClose={() => setCitationDrawerOpen(false)}
                citations={activeCitations}
            />

        </div>
    );
}
