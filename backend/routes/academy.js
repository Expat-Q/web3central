const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { normalizeLearningProgressMap, serializeLearningProgress } = require('../utils/learningProgress');

const lessonCreateSchema = {
    body: {
        title: ['required', { type: 'string', minLength: 3, maxLength: 200 }],
        description: ['required', { type: 'string', minLength: 10, maxLength: 1000 }],
        module: ['required', { type: 'string', maxLength: 100 }],
        level: [{ type: 'enum', values: ['Beginner', 'Intermediate', 'Advanced'] }],
        contentMarkdown: ['required', { type: 'string', minLength: 50 }]
    }
};

const progressSchema = {
    body: {
        score: ['required', { type: 'number', min: 0, max: 100, integer: true }]
    }
};

const courseCreateSchema = {
    body: {
        title: ['required', { type: 'string', minLength: 3, maxLength: 200 }],
        url: ['required', 'url'],
        platform: [{ type: 'string', maxLength: 50 }],
        level: [{ type: 'enum', values: ['Beginner', 'Intermediate', 'Advanced'] }]
    }
};

// @desc    Get all official lessons
// @route   GET /api/academy/lessons
// @access  Public
router.get('/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find({ isUserGenerated: { $ne: true } });
        res.status(200).json({ success: true, count: lessons.length, data: lessons });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Get community lessons
// @route   GET /api/academy/community
// @access  Public
router.get('/community', async (req, res) => {
    try {
        const lessons = await Lesson.find({ isUserGenerated: true })
            .populate('author', 'name username avatarUrl twitter')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: lessons.length, data: lessons });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Create a community lesson
// @route   POST /api/academy/community
// @access  Private
router.post('/community', protect, async (req, res) => {
    try {
        const { title, description, contentMarkdown, level, module } = req.body;
        
        if (!title || !contentMarkdown || !module) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
        
        const newLesson = await Lesson.create({
            id: slug,
            slug,
            title,
            description: description || '',
            contentMarkdown,
            level: level || 'Beginner',
            module,
            isUserGenerated: true,
            author: req.user.id
        });

        res.status(201).json({ success: true, data: newLesson });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Toggle upvote on community lesson
// @route   POST /api/academy/community/:id/upvote
// @access  Private
router.post('/community/:id/upvote', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const userId = req.user.id;
        const upvoteIndex = lesson.upvotes.indexOf(userId);

        if (upvoteIndex === -1) {
            lesson.upvotes.push(userId);
        } else {
            lesson.upvotes.splice(upvoteIndex, 1);
        }

        await lesson.save();
        res.status(200).json({ success: true, upvotes: lesson.upvotes.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Rate a lesson (thumbs up or down)
// @route   POST /api/academy/community/:id/rate
// @access  Private
router.post('/community/:id/rate', protect, async (req, res) => {
    try {
        const { rating } = req.body; // 'up' or 'down'
        if (!['up', 'down'].includes(rating)) {
            return res.status(400).json({ success: false, message: 'Rating must be "up" or "down"' });
        }

        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

        const userId = req.user.id;
        if (!lesson.ratings) lesson.ratings = { thumbsUp: 0, thumbsDown: 0, thumbsUpBy: [], thumbsDownBy: [] };

        const alreadyUp = lesson.ratings.thumbsUpBy.some(id => id.toString() === userId);
        const alreadyDown = lesson.ratings.thumbsDownBy.some(id => id.toString() === userId);

        if (rating === 'up') {
            if (alreadyUp) {
                // Toggle off
                lesson.ratings.thumbsUpBy = lesson.ratings.thumbsUpBy.filter(id => id.toString() !== userId);
                lesson.ratings.thumbsUp = Math.max(0, lesson.ratings.thumbsUp - 1);
            } else {
                lesson.ratings.thumbsUpBy.push(userId);
                lesson.ratings.thumbsUp += 1;
                // Remove from down if they switched
                if (alreadyDown) {
                    lesson.ratings.thumbsDownBy = lesson.ratings.thumbsDownBy.filter(id => id.toString() !== userId);
                    lesson.ratings.thumbsDown = Math.max(0, lesson.ratings.thumbsDown - 1);
                }
            }
        } else {
            if (alreadyDown) {
                lesson.ratings.thumbsDownBy = lesson.ratings.thumbsDownBy.filter(id => id.toString() !== userId);
                lesson.ratings.thumbsDown = Math.max(0, lesson.ratings.thumbsDown - 1);
            } else {
                lesson.ratings.thumbsDownBy.push(userId);
                lesson.ratings.thumbsDown += 1;
                if (alreadyUp) {
                    lesson.ratings.thumbsUpBy = lesson.ratings.thumbsUpBy.filter(id => id.toString() !== userId);
                    lesson.ratings.thumbsUp = Math.max(0, lesson.ratings.thumbsUp - 1);
                }
            }
        }

        await lesson.save();
        res.status(200).json({ success: true, ratings: lesson.ratings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Create a new lesson
// @route   POST /api/academy
// @access  Private/Admin
router.post('/', protect, admin, validate(lessonCreateSchema), async (req, res) => {
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
        const lesson = await Lesson.findOne({ slug: req.params.slug })
            .populate('author', 'name username avatarUrl twitter');

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
router.post('/progress/:id', protect, validate(progressSchema), async (req, res) => {
    try {
        // Match on slug, fallback `id` field, or MongoDB `_id`
        const queryOptions = [{ slug: req.params.id }, { id: req.params.id }];
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            queryOptions.push({ _id: req.params.id });
        }
        
        const lesson = await Lesson.findOne({ $or: queryOptions });

        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const { score } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { map: progressMap } = normalizeLearningProgressMap(user);

        // Use slug as the consistent key — it never changes
        const progressKey = lesson.slug;
        const existingProgress = progressMap.get(progressKey);
        const alreadyCompleted = existingProgress && existingProgress.completed;

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

        progressMap.set(progressKey, {
            completed: passed || alreadyCompleted,
            quizScore: Math.max(score, existingProgress?.quizScore || 0),
            completedAt: new Date()
        });

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    totalXP: user.totalXP,
                    rank: user.rank,
                    learningProgress: Object.fromEntries(progressMap.entries())
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found after update' });
        }

        res.status(200).json({
            success: true,
            passed,
            xpGained,
            newTotalXP: updatedUser.totalXP,
            newRank: updatedUser.rank,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                bio: updatedUser.bio || '',
                twitter: updatedUser.twitter || '',
                avatarUrl: updatedUser.avatarUrl || '',
                totalXP: updatedUser.totalXP || 0,
                rank: updatedUser.rank || 'Novice',
                learningProgress: serializeLearningProgress(updatedUser.learningProgress)
            }
        });
    } catch (err) {
        console.error('Progress error:', err);
        res.status(500).json({ success: false, error: err.message });
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
// @access  Private (password-gated admin)
router.post('/courses', protect, admin, validate(courseCreateSchema), async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, data: course });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Delete a curated course
// @route   DELETE /api/academy/courses/:id
// @access  Private/Admin
router.delete('/courses/:id', protect, admin, async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
        res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Edit a community lesson (author only)
// @route   PATCH /api/academy/community/:id
// @access  Private
router.patch('/community/:id', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
        if (!lesson.isUserGenerated) return res.status(403).json({ success: false, error: 'Cannot edit curated lessons' });
        if (lesson.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        const { title, description, contentMarkdown } = req.body;
        if (title) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (contentMarkdown) lesson.contentMarkdown = contentMarkdown;
        await lesson.save();
        res.status(200).json({ success: true, data: lesson });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Delete a community lesson (author only)
// @route   DELETE /api/academy/community/:id
// @access  Private
router.delete('/community/:id', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
        if (!lesson.isUserGenerated) return res.status(403).json({ success: false, error: 'Cannot delete curated lessons' });
        if (lesson.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await lesson.deleteOne();
        res.status(200).json({ success: true, message: 'Lesson deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
