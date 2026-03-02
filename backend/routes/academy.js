const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { protect, admin } = require('../utils/authMiddleware');

// @desc    Get all lessons
// @route   GET /api/academy/lessons
// @access  Public
router.get('/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find();
        res.status(200).json({ success: true, count: lessons.length, data: lessons });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Create a new lesson
// @route   POST /api/academy
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    try {
        const newLesson = await Lesson.create(req.body);
        res.status(201).json({ success: true, data: newLesson });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Get single lesson
// @route   GET /api/academy/lessons/:slug
// @access  Public
router.get('/lessons/:slug', async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ slug: req.params.slug });

        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        res.status(200).json({ success: true, data: lesson });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Complete a lesson / Quiz
// @route   POST /api/academy/progress/:id
// @access  Private
router.post('/progress/:id', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ id: req.params.id });

        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const { score } = req.body; // e.g., 100 for 100%
        const user = await User.findById(req.user.id);

        if (!user.learningProgress) {
            user.learningProgress = new Map();
        }

        // Check if user already passed this before to prevent infinite XP farming
        const existingProgress = user.learningProgress.get(lesson.id);
        const alreadyCompleted = existingProgress && existingProgress.completed;

        const passed = score >= 80; // 80% to pass

        let xpGained = 0;
        if (passed && !alreadyCompleted) {
            xpGained = lesson.xpReward || 100;
            user.totalXP = (user.totalXP || 0) + xpGained;

            // Basic Rank System Thresholds
            if (user.totalXP >= 1000) user.rank = 'Grandmaster';
            else if (user.totalXP >= 500) user.rank = 'Specialist';
            else if (user.totalXP >= 200) user.rank = 'Explorer';
            else user.rank = 'Novice';
        }

        user.learningProgress.set(lesson.id, {
            completed: passed || alreadyCompleted, // keep true if already true
            quizScore: Math.max(score, existingProgress?.quizScore || 0), // keep highest score
            completedAt: new Date()
        });

        await user.save();

        res.status(200).json({
            success: true,
            passed,
            xpGained,
            newTotalXP: user.totalXP,
            newRank: user.rank,
            user
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
