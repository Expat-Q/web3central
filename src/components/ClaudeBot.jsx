import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

export default function ClaudeBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: "Hey builder 👋 I'm your Web3 AI assistant powered by Grok & Gemini. Ask me anything about DeFi, smart contracts, blockchain architecture, or Web3 tooling.",
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen, isFullScreen]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const newUserMessage = {
            id: Date.now(),
            role: 'user',
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Build conversation history for the API (exclude the initial greeting)
            const conversationHistory = [...messages.filter(m => m.id !== 1), newUserMessage]
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    content: data.reply
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    content: '⚠️ ' + (data.message || 'Something went wrong. Please try again.')
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: '⚠️ Unable to reach the AI service. Please check your connection and try again.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Chat window variants
    const windowVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.9, originX: 1, originY: 1 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        },
        exit: {
            opacity: 0,
            y: 20,
            scale: 0.9,
            transition: { duration: 0.2 }
        }
    };

    // Format message content — handle code blocks
    const formatMessage = (content) => {
        const parts = content.split(/(```[\s\S]*?```)/g);
        return parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeContent = part.slice(3, -3);
                const firstNewline = codeContent.indexOf('\n');
                const lang = firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : '';
                const code = firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent;
                return (
                    <pre key={i} className="bg-slate-900 text-green-400 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
                        {lang && <div className="text-slate-500 text-[10px] mb-1 uppercase">{lang}</div>}
                        <code>{code}</code>
                    </pre>
                );
            }
            // Handle inline code
            const inlineParts = part.split(/(`[^`]+`)/g);
            return (
                <span key={i}>
                    {inlineParts.map((ip, j) =>
                        ip.startsWith('`') && ip.endsWith('`')
                            ? <code key={j} className="bg-slate-200 text-purple-700 px-1 py-0.5 rounded text-xs font-mono">{ip.slice(1, -1)}</code>
                            : <span key={j}>{ip}</span>
                    )}
                </span>
            );
        });
    };

    return (
        <>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={windowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`fixed z-50 bg-white shadow-2xl flex flex-col border border-gray-200
                            ${isFullScreen
                                ? 'inset-0 rounded-none'
                                : 'bottom-6 right-6 w-[420px] h-[600px] rounded-2xl'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 to-purple-900 text-white rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Web3Central AI</h3>
                                    <p className="text-[11px] text-purple-300">AI assistant powered by Gemini</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); setIsFullScreen(false); }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gradient-to-br from-slate-800 to-indigo-900 text-white'
                                        }`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}>
                                        <div className="whitespace-pre-wrap break-words">
                                            {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-2.5"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-indigo-900 text-white flex items-center justify-center shadow-sm">
                                        <Bot size={14} />
                                    </div>
                                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-xl rounded-bl-none shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-3 border-t border-gray-100 bg-white rounded-b-2xl"
                        >
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about DeFi, smart contracts..."
                                    rows={1}
                                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                                    style={{ maxHeight: '100px' }}
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping || !inputValue.trim()}
                                    className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button — only visible when chat is closed */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
                >
                    <MessageSquare size={22} />
                </motion.button>
            )}
        </>
    );
}
