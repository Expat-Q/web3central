const express = require('express');
const router = express.Router();
const axios = require('axios');
const { logger } = require('../lib/logger');

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
        const currentTvl = p.tvl?.[p.tvl.length - 1]?.totalTvl || p.currentChainTvl?.['Total'] || 0;
        
        // Calculate 7d change if possible
        let change7d = null;
        if (p.tvl?.length > 7) {
            const nowTvl = p.tvl[p.tvl.length - 1].totalTvl;
            const weekAgoTvl = p.tvl[p.tvl.length - 8].totalTvl;
            if (weekAgoTvl > 0) {
                change7d = ((nowTvl - weekAgoTvl) / weekAgoTvl) * 100;
            }
        }

        // 3. Fetch Volume if it's a DEX/Derivatives (optional/extra)
        // We'll check if it has volume data in the response or try the overview endpoint if it's high priority.
        // For now, we'll use the data available in the protocol response.
        
        const metrics = {
            name: p.name,
            slug: p.slug,
            logo: p.logo,
            category: p.category,
            tvl: currentTvl,
            change_7d: change7d || p.change_7d || 0,
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
