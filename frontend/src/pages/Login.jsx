import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard'); // Redirect to Dashboard on success
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="bg-indigo-600 p-8 text-center">
                    <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center text-indigo-600 font-bold text-xl mb-4">S</div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-indigo-100 mt-2 text-sm">Sign in to manage your attendance</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            Don't have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}