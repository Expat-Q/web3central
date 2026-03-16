import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ApiError, getUserFriendlyMessage } from '../lib/errors';

const AuthContext = createContext();

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleAuthResponse = useCallback(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = data?.error || {};
            throw new ApiError(
                error.code || 'AUTH_ERROR',
                error.message || data.message || 'Authentication failed'
            );
        }

        return data;
    }, []);

    const register = useCallback(async (userData) => {
        if (!mountedRef.current) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await handleAuthResponse(response);

            if (!mountedRef.current) return { success: false };

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true };
            } else {
                setError(data.message || 'Registration failed');
                return { success: false, message: data.message };
            }
        } catch (err) {
            if (!mountedRef.current) return { success: false };

            const message = getUserFriendlyMessage(err);
            setError(message);
            return { success: false, message };
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [handleAuthResponse]);

    const login = useCallback(async (userData) => {
        if (!mountedRef.current) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await handleAuthResponse(response);

            if (!mountedRef.current) return { success: false };

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true };
            } else {
                setError(data.message || 'Login failed');
                return { success: false, message: data.message };
            }
        } catch (err) {
            if (!mountedRef.current) return { success: false };

            const message = getUserFriendlyMessage(err);
            setError(message);
            return { success: false, message };
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [handleAuthResponse]);

    const oauthLogin = useCallback((provider) => {
        window.location.href = `${API_BASE_URL}/auth/${provider}`;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                register,
                login,
                oauthLogin,
                logout,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
