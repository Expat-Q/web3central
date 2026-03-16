const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../utils/authMiddleware');
const { AppError, asyncHandler } = require('../errors');

router.get('/lessons', asyncHandler(async (req, res) => {
    const lessons = await Lesson.find();
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
    const newLesson = await Lesson.create(req.body);
    res.status(201).json({ success: true, data: newLesson });
}));

router.get('/lessons/:slug', asyncHandler(async (req, res) => {
    const lesson = await Lesson.findOne({ slug: req.params.slug });

    if (!lesson) {
        throw AppError.notFound('Lesson');
    }

    res.status(200).json({ success: true, data: lesson });
}));

router.post('/progress/:id', protect, asyncHandler(async (req, res) => {
    const lesson = await Lesson.findOne({ id: req.params.id });

    if (!lesson) {
        throw AppError.notFound('Lesson');
    }

    const { score } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
        throw AppError.notFound('User');
    }

    if (!user.learningProgress) {
        user.learningProgress = new Map();
    }

    const existingProgress = user.learningProgress.get(lesson.id);
    const alreadyCompleted = existingProgress?.completed;

    const passed = score >= 80;

    let xpGained = 0;
    if (passed && !alreadyCompleted) {
        xpGained = lesson.xpReward || 100;
        user.totalXP = (user.totalXP || 0) + xpGained;

        if (user.totalXP >= 1000) user.rank = 'Grandmaster';
        else if (user.totalXP >= 500) user.rank = 'Specialist';
        else if (user.totalXP >= 200) user.rank = 'Explorer';
        else user.rank = 'Novice';
    }

    user.learningProgress.set(lesson.id, {
        completed: passed || alreadyCompleted,
        quizScore: Math.max(score, existingProgress?.quizScore || 0),
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
}));

router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
}));

router.post('/courses', protect, asyncHandler(async (req, res) => {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
}));

router.delete('/courses/:id', protect, asyncHandler(async (req, res) => {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
        throw AppError.notFound('Course');
    }
    res.status(200).json({ success: true, message: 'Course deleted' });
}));

module.exports = router;
