const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../errors');
const { validate } = require('../middleware/validate');

const chatSchema = {
    body: {
        messages: ['required', { type: 'array', minLength: 1, maxLength: 50 }]
    }
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

const sanitizeProviderError = (message = '') => {
    return String(message || '')
        .replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED]')
        .replace(/sk-[A-Za-z0-9\-_]+/gi, '[REDACTED_KEY]')
        .slice(0, 280);
};

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

// OpenAI API call (primary)
async function callOpenAI(messages) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const modelCandidates = (
        process.env.OPENAI_MODELS
            ? process.env.OPENAI_MODELS.split(',').map(m => m.trim()).filter(Boolean)
            : [process.env.OPENAI_MODEL, 'gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1-nano']
    ).filter(Boolean);

    const tried = [];

    for (const model of modelCandidates) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: WEB3_SYSTEM_PROMPT },
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                tried.push(`${model}:${response.status}`);
                console.warn(`OpenAI failed on model ${model}:`, errBody.slice(0, 300));
                continue;
            }

            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content;
            if (!text) {
                tried.push(`${model}:empty-response`);
                continue;
            }

            return text;
        } catch (err) {
            tried.push(`${model}:network-error`);
            console.warn(`OpenAI request failed on model ${model}:`, err.message);
        }
    }

    throw new Error(`OpenAI API failed for all candidate models: ${tried.join(', ') || 'none-tried'}`);
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

// POST /api/chat — OpenAI primary, Grok fallback
router.post('/', validate(chatSchema), asyncHandler(async (req, res) => {
    const { messages } = req.body;
    res.setHeader('X-Chat-Provider-Chain', 'openai>grok>offline-fallback');
    const includeDebug = process.env.CHAT_DEBUG === 'true';

    // Sanitize messages to only include role and content
    const sanitized = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
    }));

    let reply;
    let provider = 'openai';
    const diagnostics = { providerChain: 'openai>grok>offline-fallback' };

    try {
        reply = await callOpenAI(sanitized);
    } catch (openaiErr) {
        console.warn('OpenAI failed:', openaiErr.message);
        diagnostics.openaiError = sanitizeProviderError(openaiErr.message);
        provider = 'grok';
        try {
            reply = await callGrok(sanitized);
        } catch (grokErr) {
            console.error('[Chat] AI providers failed.');
            console.error('  OpenAI:', openaiErr.message);
            console.error('  Grok:', grokErr.message);
            diagnostics.grokError = sanitizeProviderError(grokErr.message);
            provider = 'offline-fallback';
            reply = buildOfflineFallbackReply(sanitized);
        }
    }

    if (includeDebug) {
        return res.json({ success: true, reply, provider, diagnostics });
    }

    res.json({ success: true, reply, provider });
}));

module.exports = router;
