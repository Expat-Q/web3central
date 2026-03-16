const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validate');

const WEB3_SYSTEM_PROMPT = `You are Web3Central AI, an expert Web3 development assistant embedded in the web3central platform. You specialize in:

- DeFi protocols (DEXs, lending, yield farming, liquid staking)
- Smart contract development (Solidity, Vyper, security patterns)
- Blockchain architecture (L1s, L2s, rollups, bridges)
- Web3 tooling (wallets, oracles, indexers, RPCs)
- Token economics and governance
- NFT standards and marketplaces
- Cross-chain interoperability

Guidelines:
- Give concise, actionable answers
- Include code snippets when relevant (Solidity, JavaScript/ethers.js)
- Warn about security risks and common attack vectors
- Reference specific protocols and tools when applicable
- If asked about non-Web3 topics, politely redirect to Web3-related help
- Keep responses focused and under 500 words unless a longer explanation is needed`;

// Grok (xAI) API call
async function callGrok(messages) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error('AI service not configured');

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-3-mini',
            messages: [
                { role: 'system', content: WEB3_SYSTEM_PROMPT },
                ...messages
            ],
            max_tokens: 1024,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Gemini API call
async function callGemini(messages) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('AI service not configured');

    // Convert chat messages to Gemini format
    const geminiContents = [];

    // Add system instruction as first user turn context
    geminiContents.push({
        role: 'user',
        parts: [{ text: WEB3_SYSTEM_PROMPT + '\n\nPlease acknowledge and follow these instructions.' }]
    });
    geminiContents.push({
        role: 'model',
        parts: [{ text: 'Understood. I am Web3Central AI, ready to assist with all Web3-related questions.' }]
    });

    // Add conversation history
    for (const msg of messages) {
        geminiContents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        });
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: geminiContents,
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.7
                }
            })
        }
    );

    if (!response.ok) {
        console.error(`[Gemini] HTTP ${response.status}`);
        throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('AI returned an empty response');
    }
    return data.candidates[0].content.parts[0].text;
}

// POST /api/chat — Gemini primary, Grok fallback
router.post('/', validate(schemas.chat), async (req, res) => {
    try {
        const { messages } = req.body;

        // Sanitize messages to only include role and content
        const sanitized = messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content).slice(0, 2000)
        }));

        let reply;
        let provider = 'gemini';

        try {
            reply = await callGemini(sanitized);
        } catch (geminiErr) {
            console.warn('Gemini failed:', geminiErr.message);
            provider = 'grok';
            try {
                reply = await callGrok(sanitized);
            } catch (grokErr) {
                console.error('[Chat] Both AI providers failed');
                return res.status(503).json({
                    success: false,
                    message: 'AI service temporarily unavailable'
                });
            }
        }

        res.json({ success: true, reply, provider });
    } catch (err) {
        console.error('Chat route error:', err.message);
        res.status(500).json({ success: false, message: 'Chat service error' });
    }
});

module.exports = router;
