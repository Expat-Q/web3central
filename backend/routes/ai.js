const express = require('express');
const { protect, admin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const router = express.Router();

// @desc    Generate a 5-question quiz based on lesson markdown content using Gemini
// @route   POST /api/ai/generate-quiz
// @access  Private/Admin
router.post('/generate-quiz', protect, admin, validate(schemas.generateQuiz), async (req, res) => {
    try {
        const { content } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ success: false, message: 'AI service not configured' });
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
            console.error(`[Gemini Quiz] HTTP ${response.status}`);
            return res.status(503).json({ success: false, message: 'AI service temporarily unavailable' });
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return res.status(503).json({ success: false, message: 'AI service returned empty response' });
        }

        // Strip any markdown code fences Gemini might add
        const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let quiz;
        try {
            quiz = JSON.parse(cleanedText);
        } catch {
            return res.status(500).json({ success: false, message: 'AI returned invalid quiz format' });
        }

        // Validate the schema
        if (!Array.isArray(quiz) || quiz.length === 0) {
            return res.status(500).json({ success: false, message: 'AI returned invalid quiz format' });
        }

        for (const q of quiz) {
            if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswerIndex !== 'number') {
                return res.status(500).json({ success: false, message: 'One or more questions have invalid format' });
            }
        }

        res.json({ success: true, quiz });
    } catch (error) {
        console.error('AI Quiz Generation Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate quiz' });
    }
});

module.exports = router;
