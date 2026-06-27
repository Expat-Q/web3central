import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        const res = await forgotPassword({
            email: formData.email,
            newPassword: formData.newPassword
        });

        if (res.success) {
            setSuccessMessage('Password updated successfully! Redirecting...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            setError(res.message || 'Failed to reset password. Please verify your email.');
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
                className="w-full max-w-lg relative z-10"
            >
                <div className="bg-white border border-gray-100 p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    
                    <div className="mb-8">
                        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors">
                            <ArrowLeft size={16} className="mr-2" /> Back to Sign In
                        </Link>
                    </div>

                    <div className="text-center mb-12">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-bold text-indigo-500 tracking-wider uppercase mb-6"
                        >
                            Security Recovery
                        </motion.span>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Reset <span className="text-purple-600">Password</span></h1>
                        <p className="text-gray-500 font-medium">Enter your registered email and set a new password.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-2xl text-sm font-medium"
                            >
                                {successMessage}
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-500 pl-2">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-300"
                                placeholder="architect@web3central.io"
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-500 pl-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    required
                                    value={formData.newPassword}
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
                            <label className="text-xs font-semibold text-gray-500 pl-2">Confirm New Password</label>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl transition-all shadow-xl shadow-gray-200 hover:scale-[1.01] active:scale-[0.99] hover:bg-purple-600 disabled:opacity-50"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
