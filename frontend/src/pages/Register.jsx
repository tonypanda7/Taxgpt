import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            await register(email, password);
            // New users must complete onboarding
            navigate('/onboarding');
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

                {/* Header */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                        <span className="text-white font-bold text-lg">₹</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">TaxCopilot</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Create an account</h1>
                <p className="text-gray-500 mb-6 text-sm">Join to personalize your tax savings journey.</p>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 mb-6 text-sm flex items-start gap-2">
                        <span className="text-lg leading-none mt-0.5">•</span>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-gray-100/50 focus:bg-white"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 hover:bg-gray-100/50 focus:bg-white"
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-gray-900 hover:bg-black text-white font-medium rounded-xl py-3 text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                    >
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Continue'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                            Sign in
                        </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-6 max-w-sm mx-auto leading-relaxed">
                        By continuing, you agree to our Terms of Service and acknowledge that your PAN/Aadhaar details are strictly encrypted and never shared.
                    </p>
                </div>

            </div>
        </div>
    );
}
