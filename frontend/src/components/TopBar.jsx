import { Bell, ChevronDown } from 'lucide-react';

export default function TopBar() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-700 border border-gray-200">
                    FY 2024-25
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="text-gray-500 hover:text-gray-700 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium shadow-sm">
                        R
                    </div>
                    <span className="text-sm font-medium text-gray-700">Rahul M.</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </header>
    );
}
