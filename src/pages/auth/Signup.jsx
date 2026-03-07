import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaDiscord, FaTwitter } from 'react-icons/fa';
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
            navigate('/academy');
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    const handleOAuth = (provider) => {
        setLoading(true);
        oauthLogin(provider);
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
                            className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mb-6"
                        >
                            Protocol Onboarding
                        </motion.span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tighter italic uppercase">Join <span className="text-purple-600">Network</span></h1>
                        <p className="text-gray-500 font-medium">Create your credentials to join our community.</p>
                    </div>

                    {/* Social Login Section */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <button type="button" onClick={() => handleOAuth('google')} className="flex items-center justify-center py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                            <FcGoogle size={24} />
                        </button>
                        <button type="button" onClick={() => handleOAuth('discord')} className="flex items-center justify-center py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                            <FaDiscord size={24} className="text-[#5865F2]" />
                        </button>
                        <button type="button" onClick={() => handleOAuth('twitter')} className="flex items-center justify-center py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                            <FaTwitter size={24} className="text-[#1DA1F2]" />
                        </button>
                    </div>

                    <div className="relative flex items-center gap-4 mb-8">
                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or use email</span>
                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Username</label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email</label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Password</label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Verify Password</label>
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
                            className="w-full py-5 bg-gray-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] hover:bg-purple-600 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Initializing...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-gray-50 text-center">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
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
