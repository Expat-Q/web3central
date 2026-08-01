import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        if (!code) {
            navigate('/login?error=OAuth_Token_Missing');
            return;
        }

        // Clean the code from the URL immediately so it's not in browser history
        window.history.replaceState({}, document.title, window.location.pathname);

        const API_BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api'
            : '/api';

        // Exchange the one-time code for a JWT — code never stays in URL or history
        fetch(`${API_BASE_URL}/auth/oauth/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Hard navigate to reset AuthContext state
                    window.location.href = '/';
                } else {
                    navigate('/login?error=OAuth_Exchange_Failed');
                }
            })
            .catch(() => {
                navigate('/login?error=OAuth_Server_Error');
            });
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center max-w-sm"
            >
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
                <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-widest">Securing Session</h1>
                <p className="text-gray-500 font-medium">Please wait while we log you in...</p>
            </motion.div>
        </div>
    );
}
