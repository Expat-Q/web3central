const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect, admin } = require('../middleware/auth');
const { asyncHandler } = require('../errors');

// @desc    Get all news articles
// @route   GET /api/news
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    // Sort by latest publishedAt
    const news = await News.find().sort({ publishedAt: -1 });

    res.status(200).json({
        success: true,
        count: news.length,
        data: news
    });
}));

// @desc    Get single news article by slug
// @route   GET /api/news/:slug
// @access  Public
router.get('/:slug', asyncHandler(async (req, res) => {
    const article = await News.findOne({ slug: req.params.slug });

    if (!article) {
        return res.status(404).json({ success: false, message: `No news article found with slug ${req.params.slug}` });
    }

    res.status(200).json({
        success: true,
        data: article
    });
}));

// @desc    Create a new news article
// @route   POST /api/news
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    // Generate a slug if not provided
    if (!req.body.slug && req.body.title) {
        req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const article = await News.create(req.body);

    res.status(201).json({
        success: true,
        data: article
    });
}));

// @desc    Delete a news article
// @route   DELETE /api/news/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const article = await News.findById(req.params.id);

    if (!article) {
        return res.status(404).json({ success: false, message: `No news article found with id ${req.params.id}` });
    }

    await News.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
}));

module.exports = router;
