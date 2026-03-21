const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tool = require('../models/Tool');
const { asyncHandler } = require('../errors');

router.get('/overview', asyncHandler(async (req, res) => {
    const [totalUsers, activeTools, pendingTools] = await Promise.all([
        User.countDocuments(),
        Tool.countDocuments({ status: { $in: ['active', 'experimental'] } }),
        Tool.countDocuments({ status: 'pending' })
    ]);

    res.json({
        success: true,
        users: totalUsers,
        activeTools: activeTools,
        pendingTools: pendingTools
    });
}));

module.exports = router;
