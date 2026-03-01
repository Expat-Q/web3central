import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { fetchLessonById, submitLessonProgress } from '../services/apiService';
import {
    ArrowLeft,
    BookOpen,
    Award,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Trophy,
    Sparkles,
    Timer,
    Unlock
} from 'lucide-react';

export default function LessonDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);

    // Quiz State
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const data = await fetchLessonById(slug);
                if (data) {
                    if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
                        data.quiz = data.quiz[0];
                    }
                    setLesson(data);
                }
            } catch (err) {
                console.error('Error fetching lesson:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [slug]);

    const handleOptionSelect = (index) => {
        if (!isAnswerRevealed) {
            setSelectedOption(index);
        }
    };

    const handleCheckAnswer = () => {
        if (selectedOption === null) return;
        setIsAnswerRevealed(true);
        const currentQ = lesson.quiz.questions[currentQuestionIndex];
        if (selectedOption === currentQ.correctAnswerIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex + 1 < lesson.quiz.questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerRevealed(false);
        } else {
            // Finish Quiz
            setQuizFinished(true);
            const totalQuestions = lesson.quiz.questions.length;
            const finalScorePercentage = (score / totalQuestions) * 100;

            if (user) {
                try {
                    const token = localStorage.getItem('token');
                    const result = await submitLessonProgress(lesson.id, finalScorePercentage, token);
                    setSubmitResult(result);
                } catch (err) {
                    console.error('Error saving progress:', err);
                }
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!lesson) return (
        <div className="min-h-screen pt-40 flex flex-col items-center bg-white text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
            <Link to="/academy" className="text-purple-600 hover:underline">Return to Academy</Link>
        </div>
    );

    const currentQ = lesson.quiz?.questions?.[currentQuestionIndex];

    return (
        <div className="min-h-screen pt-32 pb-32 px-6 bg-white relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header Navigation */}
                <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <button
                        onClick={() => navigate('/academy')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors bg-gray-50 hover:bg-purple-50 px-4 py-2 rounded-xl"
                    >
                        <ArrowLeft size={16} /> Back to Curriculum
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 font-bold text-xs uppercase tracking-wider">
                            <BookOpen size={14} /> {lesson.module}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100 font-bold text-xs uppercase tracking-wider">
                            <Award size={14} /> +{lesson.xpReward} XP
                        </div>
                    </div>
                </div>

                {!showQuiz ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden"
                    >
                        {/* Title Section */}
                        <div className="p-8 md:p-12 border-b border-gray-100 bg-gray-50/50">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
                                {lesson.title}
                            </h1>
                            <p className="text-lg text-gray-500 font-medium flex items-center gap-3">
                                <Timer size={18} className="text-gray-400" /> {lesson.estimatedTime} reading time
                            </p>
                        </div>

                        {/* Markdown Content */}
                        <div className="p-8 md:p-12 prose prose-lg prose-purple max-w-none prose-headings:font-bold prose-h1:text-3xl prose-p:text-gray-600 prose-p:leading-relaxed">
                            <ReactMarkdown>{lesson.contentMarkdown}</ReactMarkdown>
                        </div>

                        {/* Footer Action */}
                        <div className="p-8 md:p-12 bg-gray-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Ready to test your knowledge?</h3>
                                <p className="text-gray-400 font-medium">Pass the quiz to earn {lesson.xpReward} Mastery XP.</p>
                            </div>
                            <button
                                onClick={() => setShowQuiz(true)}
                                className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                            >
                                Start Assessment <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden"
                    >
                        {!quizFinished ? (
                            <div className="p-8 md:p-12">
                                {/* Quiz Header */}
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Knowledge Check</h2>
                                    <span className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-sm text-gray-600">
                                        Question {currentQuestionIndex + 1} of {lesson.quiz.questions.length}
                                    </span>
                                </div>

                                {/* Question */}
                                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                                    {currentQ?.questionText}
                                </h3>

                                {/* Options */}
                                <div className="space-y-4 mb-10">
                                    {currentQ?.options.map((option, idx) => {
                                        let optionClass = "border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-600";

                                        if (isAnswerRevealed) {
                                            if (idx === currentQ.correctAnswerIndex) {
                                                optionClass = "border-green-500 bg-green-50 text-green-700";
                                            } else if (idx === selectedOption) {
                                                optionClass = "border-red-500 bg-red-50 text-red-700";
                                            } else {
                                                optionClass = "border-gray-100 bg-gray-50 text-gray-400 opacity-50";
                                            }
                                        } else if (selectedOption === idx) {
                                            optionClass = "border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(idx)}
                                                disabled={isAnswerRevealed}
                                                className={`w-full text-left p-6 rounded-2xl border-2 font-medium text-lg transition-all ${optionClass} flex items-center justify-between`}
                                            >
                                                <span>{option}</span>
                                                {isAnswerRevealed && idx === currentQ.correctAnswerIndex && <CheckCircle2 className="text-green-500" />}
                                                {isAnswerRevealed && idx === selectedOption && idx !== currentQ.correctAnswerIndex && <XCircle className="text-red-500" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Explanation Block */}
                                <AnimatePresence>
                                    {isAnswerRevealed && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className={`mb-10 p-6 rounded-2xl ${selectedOption === currentQ.correctAnswerIndex
                                                ? 'bg-green-50 border border-green-100'
                                                : 'bg-red-50 border border-red-100'
                                                }`}
                                        >
                                            <h4 className={`font-bold mb-2 flex items-center gap-2 ${selectedOption === currentQ.correctAnswerIndex ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                {selectedOption === currentQ.correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed font-medium">
                                                {currentQ.explanation}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Button */}
                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    {!isAnswerRevealed ? (
                                        <button
                                            onClick={handleCheckAnswer}
                                            disabled={selectedOption === null}
                                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${selectedOption !== null
                                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Check Answer
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                                        >
                                            {currentQuestionIndex + 1 === lesson.quiz.questions.length ? 'See Results' : 'Next Question'} <ChevronRight size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 md:p-20 text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-50 rounded-full mb-8 shadow-inner border border-yellow-100">
                                    <Trophy size={48} className="text-yellow-500" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Mission Complete</h2>

                                <div className="text-6xl font-black text-purple-600 mb-8 tracking-tighter">
                                    {Math.round((score / lesson.quiz.questions.length) * 100)}%
                                </div>

                                {submitResult?.passed ? (
                                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8 inline-block text-left max-w-md mx-auto">
                                        <h4 className="font-bold text-green-700 flex items-center gap-2 justify-center mb-2">
                                            <Sparkles size={18} /> Mastery Achieved
                                        </h4>
                                        <p className="text-green-800 text-sm text-center">
                                            You earned <strong>{submitResult.xpGained} XP!</strong> Your total is now {submitResult.newTotalXP} XP. You hold the rank of <strong>{submitResult.newRank}</strong>.
                                        </p>
                                    </div>
                                ) : submitResult && !submitResult.passed ? (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 inline-block text-center max-w-md mx-auto">
                                        <h4 className="font-bold text-red-700 mb-2">Keep Trying</h4>
                                        <p className="text-red-800 text-sm">
                                            You need an 80% to master this module and earn XP. Review the material and try again.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 mb-8">Sign in or create an account to save your progress and earn XP.</p>
                                )}

                                <div>
                                    <button
                                        onClick={() => navigate('/academy')}
                                        className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        Return to Curriculum <Unlock size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
