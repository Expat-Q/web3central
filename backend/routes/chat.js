const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../errors');
const { validate } = require('../middleware/validate');

const MAX_ERROR_MESSAGE_LENGTH = 150;

const chatSchema = {
    body: {
        messages: ['required', { type: 'array', minLength: 1, maxLength: 50 }]
    }
};

const GEMINI_FREE_TIER_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash'
];

let geminiModelsCache = {
    expiresAt: 0,
    models: []
};

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

function buildOfflineFallbackReply(messages) {
    const latestUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user' && m.content)?.content?.toLowerCase() || '';

    if (latestUserMessage.includes('liquidity') || latestUserMessage.includes('lp')) {
        return `DeFi liquidity provision means depositing token pairs into a protocol pool so traders can swap assets instantly.

How it works:
- You deposit tokens (e.g., ETH/USDC) into a pool
- Traders pay swap fees when using that pool
- You earn a share of fees proportional to your pool share

Main risks:
- Impermanent loss when token prices diverge
- Smart contract risk
- Pool-specific risk (oracle, governance, exploit)

Quick checklist:
- Start with blue-chip pools/protocols
- Compare fee APR vs IL risk
- Avoid thin-liquidity pools unless you understand volatility.`;
    }

    if (latestUserMessage.includes('dex')) {
        return `A DEX (decentralized exchange) lets users trade directly from their wallets using smart contracts.

Core model:
- AMM DEXs (e.g., Uniswap): swaps against liquidity pools
- Orderbook DEXs (e.g., dYdX style): bids/asks on-chain or hybrid

Pros: self-custody, permissionless access.
Tradeoffs: slippage, MEV, and gas costs depending on chain.`;
    }

    if (latestUserMessage.includes('bridge') || latestUserMessage.includes('cross-chain')) {
        return `Cross-chain bridges move value/messages between blockchains.

Typical flow:
- Asset is locked/burned on source chain
- Equivalent asset is minted/released on destination chain

Watchouts:
- Bridge contracts are high-value attack targets
- Confirm canonical bridge vs third-party bridge
- Check finality times and withdrawal assumptions.`;
    }

    return `I can help with Web3 basics right now:
- DEXs and AMMs
- Liquidity provision and yield
- L2s and bridges
- Smart contract security fundamentals

Ask a specific question (e.g., “How does impermanent loss work?”) and I’ll give a concise breakdown.`;
}

// Grok (xAI) API call
async function callGrok(messages) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY not configured');

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
        const errBody = await response.text();
        throw new Error(`Grok API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Gemini API call
async function getAvailableGeminiModels(apiKey) {
    const now = Date.now();
    if (geminiModelsCache.expiresAt > now && geminiModelsCache.models.length > 0) {
        return geminiModelsCache.models;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const models = (data.models || [])
            .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map(m => (m.name || '').replace('models/', ''))
            .filter(Boolean);

        geminiModelsCache = {
            expiresAt: now + 10 * 60 * 1000,
            models
        };

        return models;
    } catch {
        return [];
    }
}

async function callGemini(messages) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const availableModels = await getAvailableGeminiModels(apiKey);

    const preferred = [process.env.GEMINI_MODEL, ...GEMINI_FREE_TIER_MODELS].filter(Boolean);

    const preferredAvailable = preferred.filter(model => availableModels.includes(model));

    const discoveredFlash = availableModels.filter(model =>
        model.includes('flash') && !preferredAvailable.includes(model)
    );

    const modelCandidates = [
        ...preferredAvailable,
        ...discoveredFlash,
        ...preferred
    ]
        .filter(Boolean)
        .filter((model, index, arr) => arr.indexOf(model) === index);

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

    let lastError = null;

    for (const model of modelCandidates) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
            const errBody = await response.text();
            console.warn(`[Gemini:${model}] HTTP ${response.status}:`, errBody);
            lastError = new Error(`Gemini API error (${model}) ${response.status}`);
            continue;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            return text;
        }

        console.warn(`[Gemini:${model}] Empty response payload`);
        lastError = new Error(`Gemini returned an empty response (${model})`);
    }

    throw lastError || new Error('Gemini request failed');
}

// POST /api/chat — Gemini primary, Grok fallback
router.post('/', validate(chatSchema), asyncHandler(async (req, res) => {
    const { messages } = req.body;

    // Sanitize messages to only include role and content
    const sanitized = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
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
            console.error('[Chat] Both AI providers failed.');
            console.error('  Gemini:', geminiErr.message);
            console.error('  Grok:', grokErr.message);
            provider = 'offline-fallback';
            reply = buildOfflineFallbackReply(sanitized);
        }
    }

    res.json({ success: true, reply, provider });
}));

module.exports = router;
