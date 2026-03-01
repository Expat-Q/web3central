import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Rating from './Rating';
import { useAuth } from '../context/AuthContext';

export default function RatingModal({ tool, onClose, onRatingSubmitted }) {
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (score === 0) {
            setError('Please select a star rating.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`http://localhost:5000/api/ratings/${tool.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ score, comment })
            });

            const data = await res.json();
            if (data.success) {
                onRatingSubmitted(data.toolAvg);
                onClose();
            } else {
                setError(data.message || 'Failed to submit rating.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card max-w-lg w-full p-8 relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold mb-2">Rate {tool.name}</h2>
                <p className="text-gray-400 text-sm mb-8">Share your experience with the community.</p>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-8 flex flex-col items-center">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Your Rating</p>
                        <Rating onRate={setScore} />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                            Optional Comment
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What do you like or dislike about this tool?"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors h-32 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !user}
                        className="w-full btn-primary py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : !user ? (
                            'Login to Rate'
                        ) : (
                            'Submit Rating'
                        )}
                    </button>

                    {!user && (
                        <p className="mt-4 text-center text-xs text-gray-500">
                            You must be logged in to submit a review.
                        </p>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
