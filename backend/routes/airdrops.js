const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory cache
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * @route   GET /api/airdrops
 * @desc    Fetch airdrop activities from CryptoRank Drophunting
 *          Primary: Page __NEXT_DATA__ scrape (free, rich data, 20 items/page)
 *          Secondary: CryptoRank API v2 (requires paid plan)
 *          Fallback: DeFiLlama tokenless protocols
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if fresh
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      return res.json({
        success: true,
        data: cachedData.activities,
        total: cachedData.activities.length,
        source: cachedData.source,
        cached: true,
        updatedAt: new Date(cacheTimestamp).toISOString()
      });
    }

    // Strategy 1: Scrape CryptoRank drophunting page __NEXT_DATA__ (free, structured)
    try {
      const scraped = await scrapeCryptoRankPage();
      if (scraped && scraped.length > 0) {
        cachedData = { activities: scraped, source: 'CryptoRank' };
        cacheTimestamp = now;
        return res.json({
          success: true,
          data: scraped,
          total: scraped.length,
          source: 'CryptoRank',
          cached: false,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (scrapeErr) {
      console.error('CryptoRank page scrape failed:', scrapeErr.message);
    }

    // Strategy 2: CryptoRank API v2 (paid plan only)
    const apiKey = process.env.CRYPTORANK_API_KEY;
    if (apiKey) {
      try {
        const apiData = await fetchCryptoRankAPI(apiKey);
        if (apiData && apiData.length > 0) {
          cachedData = { activities: apiData, source: 'CryptoRank' };
          cacheTimestamp = now;
          return res.json({
            success: true,
            data: apiData,
            total: apiData.length,
            source: 'CryptoRank',
            cached: false,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (apiErr) {
        console.log('CryptoRank API unavailable:', apiErr.message);
      }
    }

    // Strategy 3: DeFiLlama fallback
    const fallbackData = await fetchDeFiLlamaFallback();
    cachedData = { activities: fallbackData, source: 'DeFiLlama' };
    cacheTimestamp = now;
    res.json({
      success: true,
      data: fallbackData,
      total: fallbackData.length,
      source: 'DeFiLlama',
      cached: false,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Airdrops API error:', err.message);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.activities,
        total: cachedData.activities.length,
        source: cachedData.source,
        cached: true,
        stale: true
      });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch airdrop data' });
  }
});

/**
 * Scrape CryptoRank drophunting page — extracts __NEXT_DATA__ JSON from HTML
 * Returns up to 20 fully-structured activities with VC backers, rewards, costs, etc.
 * Zero API credits used.
 */
async function scrapeCryptoRankPage() {
  const response = await axios.get('https://cryptorank.io/drophunting', {
    timeout: 15000,
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    }
  });

  const html = response.data;

  // Extract __NEXT_DATA__ from the Next.js app
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('__NEXT_DATA__ not found on page');

  const nextData = JSON.parse(match[1]);
  const pageProps = nextData?.props?.pageProps;

  // The main table data lives in fallbackTableData
  const tableData = pageProps?.fallbackTableData;
  if (!tableData?.data || !Array.isArray(tableData.data)) {
    throw new Error('No fallbackTableData.data found');
  }

  console.log(`CryptoRank page scrape: ${tableData.data.length} activities extracted (${tableData.count} total on platform)`);

  // Also grab hot events and widget data for enrichment
  const hotEvents = pageProps?.widgetsData?.hotEvents || [];
  const nextRewards = pageProps?.widgetsData?.nextRewards || [];

  // Map each activity to our unified shape
  return tableData.data.map(a => ({
    id: a.key,
    key: a.key,
    name: a.coin?.name || 'Unknown',
    symbol: a.coin?.symbol || null,
    logo: a.coin?.icon || null,
    rating: a.rating || null,

    // Status
    status: a.status || 'POTENTIAL',
    statusUpdatedAt: a.statusUpdatedAt || null,
    createdAt: a.createdAt || null,

    // Reward
    reward: a.rewardType || null,
    activityPoints: a.activityPoints || null,

    // Activity
    activityTypes: a.activityTypes || [],
    noActiveTask: a.noActiveTask || false,

    // Cost & Time
    totalCost: a.cost || 0,
    totalTimeMinutes: a.time || 0,

    // Funds / Backers
    funds: (a.coin?.funds || []).map(f => ({
      slug: f.slug,
      name: f.name,
      logo: f.logo || null,
      tier: f.tier || null,
      isLead: f.isLead || false,
      category: f.category || null
    })),
    totalRaise: a.coin?.totalRaise || null,

    // Social
    twitterScore: a.coin?.twitterScore?.twitterScore || null,
    followersCount: a.coin?.twitterScore?.followersCount || null,

    // Links
    claimUrl: a.linkToClaim || null,
    checkUrl: a.checkLink || null,
    exploreUrl: `https://cryptorank.io/drophunting/${a.key}`,
    coinUrl: a.coin?.key ? `https://cryptorank.io/price/${a.coin.key}` : null,

    _source: 'cryptorank-page'
  }));
}

/**
 * CryptoRank API v2 — requires paid plan for drophunting endpoint
 */
async function fetchCryptoRankAPI(apiKey) {
  const response = await axios.get('https://api.cryptorank.io/v2/drophunting/activities', {
    timeout: 15000,
    headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' },
    params: { limit: 100, sortBy: 'lastStatusUpdate', sortDirection: 'DESC' }
  });

  const activities = response.data?.data;
  if (!Array.isArray(activities)) throw new Error('Invalid CryptoRank API response');

  console.log(`CryptoRank API: ${activities.length} activities fetched`);
  return activities.map(a => ({
    id: a.id || a.key,
    key: a.key,
    name: a.coin?.name || 'Unknown',
    symbol: a.coin?.symbol || null,
    logo: a.coin?.images?.x150 || a.coin?.images?.x60 || null,
    rating: null,
    status: a.status || 'POTENTIAL',
    statusUpdatedAt: a.lastStatusUpdate || null,
    createdAt: null,
    reward: a.reward || null,
    activityPoints: null,
    activityTypes: [],
    noActiveTask: false,
    totalCost: (a.tasks || []).reduce((s, t) => s + parseFloat(t.cost || 0), 0),
    totalTimeMinutes: (a.tasks || []).reduce((s, t) => s + parseInt(t.timeMinutes || 0, 10), 0),
    funds: (a.coin?.funds || []).map(f => ({
      slug: f.slug, name: f.name, logo: f.logo, tier: f.tier, isLead: f.isLead, category: null
    })),
    totalRaise: a.coin?.totalRaise || null,
    twitterScore: a.coin?.xScore?.score || null,
    followersCount: null,
    claimUrl: a.links?.claim || null,
    checkUrl: a.links?.verify || null,
    exploreUrl: `https://cryptorank.io/drophunting/${a.key}`,
    coinUrl: null,
    _source: 'cryptorank-api'
  }));
}

/**
 * DeFiLlama tokenless protocols — last resort fallback
 */
async function fetchDeFiLlamaFallback() {
  const response = await axios.get('https://api.llama.fi/protocols', {
    timeout: 30000,
    headers: { 'Accept': 'application/json' }
  });

  const protocols = response.data;
  if (!Array.isArray(protocols)) throw new Error('Invalid DeFiLlama response');

  return protocols
    .filter(p => {
      const symbol = (p.symbol || '').trim();
      return (!symbol || symbol === '-' || symbol === '—') && (p.tvl || 0) > 100000;
    })
    .map(p => ({
      id: p.slug,
      key: p.slug,
      name: p.name,
      symbol: null,
      logo: p.logo ? `https://icons.llama.fi/protocols/${p.slug}` : null,
      rating: null,
      status: 'POTENTIAL',
      statusUpdatedAt: null,
      createdAt: p.listedAt ? new Date(p.listedAt * 1000).toISOString() : null,
      reward: null,
      activityPoints: null,
      activityTypes: [],
      noActiveTask: true,
      totalCost: 0,
      totalTimeMinutes: 0,
      funds: [],
      totalRaise: null,
      twitterScore: null,
      followersCount: null,
      claimUrl: null,
      checkUrl: null,
      exploreUrl: p.url || '',
      coinUrl: null,
      tvl: p.tvl || 0,
      category: p.category || 'Unknown',
      chains: p.chains || [],
      description: p.description || '',
      _source: 'defillama'
    }))
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 100);
}

module.exports = router;
