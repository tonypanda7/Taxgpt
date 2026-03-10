import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText, FileText, PieChart, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquareText, label: 'Chat', path: '/chat' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: PieChart, label: 'Deductions', path: '/deductions' },
    { icon: Calendar, label: 'Advance Tax', path: '/advance-tax' },
];

export default function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <span className="text-xl font-bold text-gray-900 tracking-tight">AI Tax Copilot</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                {user && (
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <Link
                    to="#"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Settings className="w-5 h-5 text-gray-400" />
                    Settings
                </Link>

                <button
                    onClick={logout}
                    className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                    <LogOut className="w-5 h-5 text-red-400" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
