import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');

        if (token) {
            // Save the token to use for the /me verification
            localStorage.setItem('token', token);

            // Fetch user profile using the token
            const API_BASE_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:5000/api'
                : '/api';

            fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        // Reload the page to reset AuthContext state and load the user natively
                        window.location.href = '/academy';
                    } else {
                        console.error('Failed to fetch user after OAuth');
                        navigate('/login?error=OAuth_User_Fetch_Failed');
                    }
                })
                .catch(err => {
                    console.error(err);
                    navigate('/login?error=OAuth_Server_Error');
                });
        } else {
            console.error('No token found in OAuth callback URL');
            navigate('/login?error=OAuth_Token_Missing');
        }
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
