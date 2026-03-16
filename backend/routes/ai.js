const express = require('express');
const { protect, admin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../errors');
const router = express.Router();

// @desc    Generate a 5-question quiz based on lesson markdown content using Gemini
// @route   POST /api/ai/generate-quiz
// @access  Private/Admin
router.post('/generate-quiz', protect, asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw AppError.validation('Content is required');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw AppError.externalService('Gemini', 'GEMINI_API_KEY not configured on server');
    }

        const prompt = `You are an expert quiz generator for a Web3 education platform. Based ONLY on the lesson content below, generate exactly 5 multiple-choice questions that test the reader's understanding of the material.

RULES:
- Each question MUST be directly answerable from the provided content
- Provide exactly 4 answer options per question  
- Questions should range from recall to application-level
- Explanations should reference specific concepts from the content

Return ONLY valid JSON — no markdown, no code fences, no extra text. Use this exact schema:
[
  {
    "questionText": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Why this answer is correct, referencing the lesson content."
  }
]

LESSON CONTENT:
${content.substring(0, 6000)}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.4
                }
            })
        }
    );

    if (!response.ok) {
        const errBody = await response.text();
        console.error(`[Gemini Quiz] HTTP ${response.status}:`, errBody);
        throw AppError.externalService('Gemini', `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw AppError.externalService('Gemini', 'No response from Gemini API');
    }

    // Strip any markdown code fences Gemini might add
    const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const quiz = JSON.parse(cleanedText);

    // Validate the schema
    if (!Array.isArray(quiz) || quiz.length === 0) {
        throw AppError.validation('Gemini returned invalid quiz format');
    }

    for (const q of quiz) {
        if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswerIndex !== 'number') {
            throw AppError.validation('One or more questions have invalid format');
        }
    }

    res.json({ success: true, quiz });
}));

module.exports = router;
