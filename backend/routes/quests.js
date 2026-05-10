const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all active quests (User view)
// @route   GET /api/quests
// @access  Public
router.get('/', async (req, res) => {
    try {
        const quests = await Quest.find({ status: 'active' }).sort({ createdAt: -1 });
        res.json({ success: true, data: quests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Get all quests (Admin view)
// @route   GET /api/quests/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const quests = await Quest.find().sort({ createdAt: -1 });
        res.json({ success: true, data: quests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Create a quest
// @route   POST /api/quests
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const quest = await Quest.create(req.body);
        res.status(201).json({ success: true, data: quest });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    Update a quest
// @route   PUT /api/quests/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const quest = await Quest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!quest) return res.status(404).json({ success: false, error: 'Quest not found' });
        res.json({ success: true, data: quest });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    Delete a quest
// @route   DELETE /api/quests/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const quest = await Quest.findByIdAndDelete(req.params.id);
        if (!quest) return res.status(404).json({ success: false, error: 'Quest not found' });
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    Complete a quest
// @route   POST /api/quests/:id/complete
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
    try {
        const quest = await Quest.findById(req.params.id);
        if (!quest) {
            return res.status(404).json({ success: false, error: 'Quest not found' });
        }

        if (quest.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Quest is no longer active' });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (user.completedQuests.includes(quest.id)) {
            return res.status(400).json({ success: false, error: 'Quest already completed' });
        }

        // --- VERIFICATION LOGIC ---
        if (quest.type === 'community-post') {
            if (!user.postCount || user.postCount < 1) {
                return res.status(400).json({ success: false, error: 'You must make at least one community post to complete this quest.' });
            }
        } else if (quest.type === 'review' || quest.type === 'app-rating') {
            if (!user.reviewCount || user.reviewCount < 1) {
                return res.status(400).json({ success: false, error: 'You must leave at least one review and rating to complete this quest.' });
            }
        } else if (quest.type === 'daily-streak') {
            const now = new Date();
            const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;
            
            if (lastClaim && lastClaim.toDateString() === now.toDateString()) {
                return res.status(400).json({ success: false, error: 'Daily reward already claimed today' });
            }

            // Calculate streak
            if (lastClaim) {
                const oneDay = 24 * 60 * 60 * 1000;
                const diff = now - lastClaim;
                if (diff < oneDay * 2) {
                    user.streak = (user.streak || 0) + 1;
                } else {
                    user.streak = 1;
                }
            } else {
                user.streak = 1;
            }

            user.lastDailyClaim = now;
            // Dynamic reward: base + multiplier based on streak
            const bonus = Math.min(user.streak * 2, 50); // Cap bonus
            const totalReward = (quest.reward || 5) + bonus;
            
            user.diamonds = (user.diamonds || 0) + totalReward;
            user.totalXP = (user.totalXP || 0) + totalReward;
            // Don't add daily-streak to completedQuests since it's repeatable
        } else {
            // Default: Link or other types that are "verified" by clicking
            user.completedQuests.push(quest.id);
            user.diamonds = (user.diamonds || 0) + (quest.reward || 0);
            user.totalXP = (user.totalXP || 0) + (quest.reward || 0);
        }

        // Update rank based on XP
        if (user.totalXP >= 5000) user.rank = 'Grandmaster';
        else if (user.totalXP >= 2000) user.rank = 'Specialist';
        else if (user.totalXP >= 500) user.rank = 'Explorer';

        await user.save();

        res.json({ 
            success: true, 
            message: 'Quest completed!', 
            diamonds: user.diamonds,
            totalXP: user.totalXP,
            rank: user.rank,
            streak: user.streak
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
