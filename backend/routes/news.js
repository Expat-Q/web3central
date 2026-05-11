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

// @desc    Update a news article
// @route   PUT /api/news/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    let article = await News.findById(req.params.id);

    if (!article) {
        return res.status(404).json({ success: false, message: `No news article found with id ${req.params.id}` });
    }

    article = await News.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
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

// @desc    Generate news articles using AI
// @route   POST /api/news/generate
// @access  Private/Admin
router.post('/generate', protect, admin, asyncHandler(async (req, res) => {
    const { query, count = 3 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `You are a professional Web3 news curator. Generate ${count} high-quality news articles about: "${query}".
    
    Each article must include:
    - title: Catchy, journalistic title (max 120 chars)
    - shortDescription: A 2-sentence summary (max 300 chars)
    - contentMarkdown: A detailed markdown body (min 300 words). Use H3 and H4 for sections.
    - tags: Array of 3-4 relevant crypto tags
    - thumbnailUrl: Use a high-quality Unsplash crypto image URL (e.g., https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000)

    Return ONLY valid JSON in this format:
    [
      {
        "title": "...",
        "shortDescription": "...",
        "contentMarkdown": "...",
        "tags": ["tag1", "tag2"],
        "thumbnailUrl": "..."
      }
    ]`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
            })
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini error:', errText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const articles = JSON.parse(cleanedText);

    const createdArticles = [];
    for (const data of articles) {
        // Generate a unique slug
        const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        
        const article = await News.create({
            ...data,
            slug,
            publishedAt: new Date(),
            author: 'Web3Central AI'
        });
        createdArticles.push(article);
    }

    res.status(201).json({
        success: true,
        count: createdArticles.length,
        data: createdArticles
    });
}));

module.exports = router;
