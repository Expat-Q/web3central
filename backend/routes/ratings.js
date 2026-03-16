const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Tool = require('../models/Tool');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// @desc    Get ratings for a specific tool
// @route   GET /api/ratings/:toolId
// @access  Public
router.get('/:toolId', async (req, res) => {
    try {
        // Basic validation for toolId
        const toolId = req.params.toolId;
        if (!toolId || toolId.length > 100) {
            return res.status(400).json({ success: false, message: 'Invalid tool ID' });
        }

        const ratings = await Rating.find({ tool: toolId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: ratings.length, data: ratings });
    } catch (err) {
        console.error('Get ratings error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch ratings' });
    }
});

// @desc    Add or update rating for a tool
// @route   POST /api/ratings/:toolId
// @access  Private
router.post('/:toolId', protect, validate(schemas.rating), async (req, res) => {
    try {
        const { score, comment } = req.body;
        const toolId = req.params.toolId;

        // Check if tool exists
        const tool = await Tool.findOne({ id: toolId });
        if (!tool) {
            return res.status(404).json({ success: false, message: 'Tool not found' });
        }

        // Check if user already rated this tool
        let rating = await Rating.findOne({ user: req.user.id, tool: toolId });

        if (rating) {
            // Update existing rating
            rating.score = score;
            rating.comment = comment;
            await rating.save();
        } else {
            // Create new rating
            rating = await Rating.create({
                user: req.user.id,
                tool: toolId,
                score,
                comment
            });
        }

        // Recalculate average rating for the tool
        const allRatings = await Rating.find({ tool: toolId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

        tool.rating = parseFloat(avgRating.toFixed(1));
        tool.reviews = allRatings.length;
        await tool.save();

        res.status(200).json({ success: true, data: rating, toolAvg: tool.rating });
    } catch (err) {
        console.error('Rating submission error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to submit rating' });
    }
});

module.exports = router;
