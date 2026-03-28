const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../lib/logger');

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

    return volume24h;
};

// @desc    Get live metrics for a protocol from DefiLlama
// @route   GET /api/defi/protocol/:slug
// @access  Public
router.get('/protocol/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
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
        
        const metrics = {
            name: p.name,
            slug: p.slug,
            logo: p.logo,
            category: p.category,
            tvl: currentTvl,
            change_7d: change7d || p.change_7d || 0,
            volume24h,
            mcap: p.mcap || 0,
            fdv: p.fdv || 0,
            chains: p.chains || [],
            symbol: p.symbol,
            twitter: p.twitter,
            description: p.description
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
