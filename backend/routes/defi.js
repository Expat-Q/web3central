const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../lib/logger');
const Tool = require('../models/Tool');

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
                name: 1
            }
        ).lean();
        
        // 1. Fetch main protocol data
        const protocolRes = await axios.get(`https://api.llama.fi/protocol/${slug}`, { timeout: 10000 });
        const p = protocolRes.data;

        if (!p || Object.keys(p).length === 0) {
            return res.status(404).json({ success: false, error: 'Protocol not found on DefiLlama' });
        }

        // 2. Extract key metrics
        // DefiLlama /protocol/{slug} response has currentChainTvl, tvl[], etc.
        const tvlSeries = Array.isArray(p.tvl) ? p.tvl : [];
        const currentTvlFromSeries = tvlSeries.length > 0 ? extractTvlValue(tvlSeries[tvlSeries.length - 1]) : 0;
        const currentTvl = currentTvlFromSeries || toNumber(p.currentChainTvl?.['Total']) || 0;
        
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
        const volume24h = await findVolume24hBySlug(slug);

        // 4. Token market data (CoinGecko fallback)
        const geckoId = toolDoc?.geckoId || p.gecko_id || p.geckoId || null;
        const coinData = await fetchCoinGeckoMarketData(geckoId);
        
        const metrics = {
            name: p.name,
            slug: p.slug,
            logo: p.logo,
            category: p.category || toolDoc?.category,
            tvl: currentTvl,
            change_7d: change7d || p.change_7d || 0,
            volume24h,
            mcap: toNumber(p.mcap) || toNumber(coinData?.mcap),
            fdv: toNumber(p.fdv) || toNumber(coinData?.fdv),
            tokenPrice: toNumber(coinData?.currentPrice) || toNumber(p.tokenPrice),
            staking: toNumber(p.staking),
            pool2: toNumber(p.pool2),
            chains: p.chains || [],
            symbol: p.symbol,
            twitter: p.twitter,
            description: p.description,
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
