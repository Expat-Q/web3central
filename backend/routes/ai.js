const express = require('express');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// Mock AI Quiz Generation (Claude API equivalent)
// @desc    Generate a 5-question logic quiz based on markdown content
// @route   POST /api/ai/generate-quiz
// @access  Private/Admin
router.post('/generate-quiz', protect, admin, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required.' });
        }

        // Simulate network delay for API connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock Payload matching the precise requested schema
        const mockQuiz = [
            {
                "question": "What is the primary topic discussed in this lesson?",
                "options": ["A concept", "A specific technology", "A generic overview", "An implementation detail"],
                "correctAnswer": 1,
                "explanation": "Based on the generated context, the focus is on a specific technology."
            },
            {
                "question": "Which of the following best describes the core mechanism?",
                "options": ["Centralized servers", "Decentralized nodes", "Manual verification", "None of the above"],
                "correctAnswer": 1,
                "explanation": "The text heavily implies decentralization as the core mechanism."
            },
            {
                "question": "What happens when a user executes this action?",
                "options": ["The transaction is rejected", "A new block is formed", "A smart contract executes", "Data is deleted"],
                "correctAnswer": 2,
                "explanation": "Smart contracts handle the execution layer described."
            },
            {
                "question": "What is the main security consideration highlighted?",
                "options": ["Reentrancy attacks", "Phishing attacks", "Malware", "Social engineering"],
                "correctAnswer": 0,
                "explanation": "The code block and text implicitly warn against logic vulnerabilities like reentrancy."
            },
            {
                "question": "How does the system ensure data integrity?",
                "options": ["Through manual audits", "Using cryptographic hashing", "By storing backups", "Via email confirmation"],
                "correctAnswer": 1,
                "explanation": "Cryptographic hashing is the standard for Web3 data integrity discussed."
            }
        ];

        res.json({ success: true, quiz: mockQuiz });
    } catch (error) {
        console.error('AI Quiz Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate quiz' });
    }
});

module.exports = router;
