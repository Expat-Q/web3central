import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register, oauthLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        const res = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password
        });

        if (res.success) {
            const params = new URLSearchParams(location.search);
            navigate(params.get('redirect') || '/');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };



    return (
        <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-white">
            {/* Minimal Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-white border border-gray-100 p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">

                    <div className="text-center mb-12">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-500 tracking-wider uppercase mb-6"
                        >
                            Protocol Onboarding
                        </motion.span>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Join <span className="text-purple-600">Web3Central</span></h1>
                        <p className="text-gray-500 font-medium">Create your credentials to join our community.</p>
                    </div>



                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 pl-2">Username</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-300"
                                    placeholder="0xArchitect"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 pl-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-300"
                                    placeholder="dev@web3central.io"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 pl-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-300 pr-12"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 pl-2">Verify Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-300 pr-12"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl transition-all shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] hover:bg-purple-600 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Initializing...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="relative mt-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            onClick={() => oauthLogin('google')}
                            className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button
                            onClick={() => oauthLogin('twitter')}
                            className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-2xl shadow-sm bg-black text-white text-sm font-bold hover:bg-gray-900 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            X
                        </button>
                    </div>

                    <div className="mt-10 pt-10 border-t border-gray-50 text-center">
                        <p className="text-gray-400 text-sm font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-purple-600 hover:text-purple-700 ml-2 transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
