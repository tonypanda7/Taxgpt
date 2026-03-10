import { X, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';

export default function CitationDrawer({ isOpen, onClose, citations = [] }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity z-40",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={cn(
                "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Legal Citations
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <p className="text-sm text-gray-600 mb-2">
                        These are the exact sections of the Income Tax Act referenced by the AI to generate the previous response.
                    </p>

                    {citations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No citations provided for this response.</p>
                        </div>
                    ) : (
                        citations.map((cite, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                                        {cite.section}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">{cite.fy}</span>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed font-serif italic mb-4">
                                    "{cite.text}"
                                </p>

                                {cite.link && cite.link !== "#" ? (
                                    <a
                                        href={cite.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        Read full section <ExternalLink className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400">
                                        Official link unavailable <ExternalLink className="w-4 h-4" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
