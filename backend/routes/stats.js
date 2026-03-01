const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tool = require('../models/Tool');

// @route   GET /api/stats/overview
// @desc    Get aggregate platform statistics
router.get('/overview', async (req, res) => {
    try {
        const [totalUsers, activeTools, pendingTools] = await Promise.all([
            User.countDocuments(),
            Tool.countDocuments({ status: { $in: ['active', 'experimental'] } }),
            Tool.countDocuments({ status: 'pending' })
        ]);

        res.json({
            users: totalUsers,
            activeTools: activeTools,
            pendingTools: pendingTools
        });
    } catch (err) {
        console.error('Error fetching global stats:', err);
        res.status(500).json({ message: 'Server error generating statistics overview' });
    }
});

module.exports = router;
