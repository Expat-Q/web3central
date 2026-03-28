const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../lib/logger');
const Tool = require('../models/Tool');
const { GECKO_MAP } = require('../services/llamaService');

const geckoIdCache = new Map();

const GECKO_OVERRIDES = {
    ...GECKO_MAP,
    'wormhole': 'wormhole',
    '0x': '0x',
    'level-finance': 'level-governance',
    'rollbit-perps': 'rollbit-coin',
    'zkx': 'zkx',
};

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const extractTvlValue = (point) => {
    if (point == null) return 0;
    if (typeof point === 'number') return toNumber(point);
    if (Array.isArray(point)) {
        // Handles [timestamp, value] style arrays
        return toNumber(point[1]);
    }
    if (typeof point === 'object') {
        return toNumber(
            point.totalLiquidityUSD ?? point.totalTvl ?? point.tvl ?? point.value ?? 0
        );
    }
    return 0;
};

const findVolume24hBySlug = async (slug) => {
    const endpoints = [
        'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume',
        'https://api.llama.fi/overview/derivatives?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume'
    ];

    let volume24h = 0;

    for (const url of endpoints) {
        try {
            const { data } = await axios.get(url, { timeout: 10000 });
            const protocols = data?.protocols || [];
            const found = protocols.find((p) => p.slug === slug);
            if (found?.total24h != null) {
                volume24h += toNumber(found.total24h);
            }
        } catch (err) {
            logger.warn('DefiLlama volume lookup failed', { slug, endpoint: url, error: err.message });
        }
    }

    // Bridges volume source (different host/shape)
    try {
        const { data } = await axios.get('https://bridges.llama.fi/bridges', { timeout: 10000 });
        const bridges = data?.bridges || [];
        const bridge = bridges.find((b) => b.slug === slug);
        if (bridge) {
            volume24h += toNumber(
                bridge.last24hVolume ??
                bridge.lastDailyVolume ??
                bridge.volumePrevDay ??
                0
            );
        }
    } catch (err) {
        logger.warn('Bridge volume lookup failed', { slug, error: err.message });
    }

    return volume24h;
};

const fetchCoinGeckoMarketData = async (geckoId) => {
    if (!geckoId) return null;
    try {
        const { data } = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(geckoId)}`,
            { timeout: 10000 }
        );
        const coin = Array.isArray(data) ? data[0] : null;
        if (!coin) return null;
        return {
            currentPrice: toNumber(coin.current_price),
            mcap: toNumber(coin.market_cap),
            fdv: toNumber(coin.fully_diluted_valuation)
        };
    } catch (err) {
        logger.warn('CoinGecko market lookup failed', { geckoId, error: err.message });
        return null;
    }
};

const normalize = (value = '') => String(value || '').trim().toLowerCase();

const resolveGeckoId = async ({ toolId, slug, explicitGeckoId, name, symbol }) => {
    const direct =
        explicitGeckoId ||
        GECKO_OVERRIDES[toolId] ||
        GECKO_OVERRIDES[slug];

    if (direct) return direct;

    const cacheKey = `${normalize(name)}::${normalize(symbol)}`;
    if (geckoIdCache.has(cacheKey)) {
        return geckoIdCache.get(cacheKey);
    }

    if (!name && !symbol) {
        geckoIdCache.set(cacheKey, null);
        return null;
    }

    try {
        const query = encodeURIComponent(name || symbol);
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`, { timeout: 10000 });
        const coins = data?.coins || [];
        const symbolNorm = normalize(symbol);
        const nameNorm = normalize(name);

        const exactById = coins.find((c) => normalize(c.id) === normalize(toolId) || normalize(c.id) === normalize(slug));
        const exactByName = coins.find((c) => normalize(c.name) === nameNorm);
        const exactBySymbol = symbolNorm ? coins.find((c) => normalize(c.symbol) === symbolNorm) : null;
        const fallbackTop = coins[0] || null;

        const resolved = exactById?.id || exactByName?.id || exactBySymbol?.id || fallbackTop?.id || null;
        geckoIdCache.set(cacheKey, resolved);
        return resolved;
    } catch (err) {
        logger.warn('CoinGecko search lookup failed', { name, symbol, error: err.message });
        geckoIdCache.set(cacheKey, null);
        return null;
    }
};

// @desc    Get live metrics for a protocol from DefiLlama
// @route   GET /api/defi/protocol/:slug
// @access  Public
router.get('/protocol/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const toolDoc = await Tool.findOne(
            {
                $or: [
                    { llamaSlug: slug },
                    { id: slug }
                ]
            },
            {
                geckoId: 1,
                category: 1,
                name: 1,
                id: 1,
                symbol: 1
            }
        ).lean();

        // 1. Fetch main protocol data
        let p = null;
        try {
            const protocolRes = await axios.get(`https://api.llama.fi/protocol/${slug}`, { timeout: 10000 });
            p = protocolRes?.data || null;
        } catch (err) {
            logger.warn('DefiLlama protocol lookup failed', { slug, error: err.message });
        }

        if (!p && !toolDoc) {
            return res.status(404).json({ success: false, error: 'Protocol not found' });
        }

        // 2. Extract key metrics
        // DefiLlama /protocol/{slug} response has currentChainTvl, tvl[], etc.
        const tvlSeries = Array.isArray(p?.tvl) ? p.tvl : [];
        const currentTvlFromSeries = tvlSeries.length > 0 ? extractTvlValue(tvlSeries[tvlSeries.length - 1]) : 0;
        const currentTvl = currentTvlFromSeries || toNumber(p?.currentChainTvl?.['Total']) || 0;
        
        // Calculate 7d change if possible
        let change7d = null;
        if (tvlSeries.length > 7) {
            const nowTvl = extractTvlValue(tvlSeries[tvlSeries.length - 1]);
            const weekAgoTvl = extractTvlValue(tvlSeries[tvlSeries.length - 8]);
            if (weekAgoTvl > 0) {
                change7d = ((nowTvl - weekAgoTvl) / weekAgoTvl) * 100;
            }
        }

        // 3. Fetch 24h volume from DEX/derivatives overview endpoints when available
        const volume24h = p ? await findVolume24hBySlug(slug) : 0;

        // 4. Token market data (CoinGecko fallback)
        const geckoId = await resolveGeckoId({
            toolId: toolDoc?.id,
            slug,
            explicitGeckoId: toolDoc?.geckoId || p?.gecko_id || p?.geckoId,
            name: p?.name || toolDoc?.name,
            symbol: p?.symbol || toolDoc?.symbol
        });
        const coinData = await fetchCoinGeckoMarketData(geckoId);

        // Persist discovered geckoId for future requests
        if (toolDoc?._id && geckoId && !toolDoc.geckoId) {
            Tool.updateOne({ _id: toolDoc._id }, { $set: { geckoId } }).catch(() => {});
        }
        
        const metrics = {
            name: p?.name || toolDoc?.name,
            slug: p?.slug || slug,
            logo: p?.logo,
            category: p?.category || toolDoc?.category,
            tvl: currentTvl,
            change_7d: change7d || p?.change_7d || 0,
            volume24h,
            mcap: toNumber(p?.mcap) || toNumber(coinData?.mcap),
            fdv: toNumber(p?.fdv) || toNumber(coinData?.fdv),
            tokenPrice: toNumber(coinData?.currentPrice) || toNumber(p?.tokenPrice),
            staking: toNumber(p?.staking),
            pool2: toNumber(p?.pool2),
            chains: p?.chains || [],
            symbol: p?.symbol || toolDoc?.symbol,
            twitter: p?.twitter,
            description: p?.description,
            geckoId
        };

        res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (err) {
        logger.error('DefiLlama proxy error:', { error: err.message, slug: req.params.slug });
        res.status(err.response?.status || 500).json({
            success: false,
            error: err.response?.data?.message || err.message
        });
    }
});

module.exports = router;
