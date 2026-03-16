const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

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
router.post('/', protect, admin, validate(schemas.lessonCreate), async (req, res) => {
    try {
        const newLesson = await Lesson.create(req.body);
        res.status(201).json({ success: true, data: newLesson });
    } catch (err) {
        console.error('Lesson creation error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create lesson' });
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
router.post('/progress/:id', protect, validate(schemas.lessonProgress), async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ id: req.params.id });

        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const { score } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

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
            newRank: user.rank
        });
    } catch (err) {
        console.error('Progress update error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
});

// ──────────────────────────────────────────
// CURATED COURSES (3rd-party external links)
// ──────────────────────────────────────────

// @desc    Get all curated courses
// @route   GET /api/academy/courses
// @access  Public
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Create a curated course
// @route   POST /api/academy/courses
// @access  Private/Admin
router.post('/courses', protect, admin, validate(schemas.courseCreate), async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, data: course });
    } catch (err) {
        console.error('Course creation error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create course' });
    }
});

// @desc    Delete a curated course
// @route   DELETE /api/academy/courses/:id
// @access  Private/Admin
router.delete('/courses/:id', protect, admin, validate(schemas.idParam), async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (err) {
        console.error('Course deletion error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to delete course' });
    }
});

module.exports = router;
