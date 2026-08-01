const express = require('express');
const Tool = require('../models/Tool');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/auth');
const { deriveToolLogo } = require('../utils/toolLogo');

const router = express.Router();

const decorateToolWithLogo = (toolDoc) => {
  const tool = toolDoc?.toObject ? toolDoc.toObject() : toolDoc;
  if (!tool.logoUrl) {
    const derived = deriveToolLogo(tool);
    if (derived.logoUrl) {
      tool.logoUrl = derived.logoUrl;
      tool.logoSource = derived.logoSource;
    }
  }
  return tool;
};

// @desc    Manually trigger DeFiLlama metrics sync
// @route   POST /api/tools/sync
// @access  Private/Admin
router.post('/sync', protect, admin, async (req, res) => {
  try {
    const { fetchLlamaData } = require('../services/llamaService');
    const updateCount = await fetchLlamaData();
    res.json({ success: true, message: `Sync completed. Updated ${updateCount} tools.` });
  } catch (err) {
    console.error('Manual sync failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Get all pending tools for review
// @route   GET /api/tools/pending
// @access  Private/Admin
router.get('/pending', protect, admin, async (req, res) => {
  try {
    const tools = await Tool.find({ status: 'pending' }).lean();
    res.json({ success: true, data: tools.map(decorateToolWithLogo) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Review/Approve/Reject a tool submission by MongoDB ID
// @route   PUT /api/tools/review/:id
// @access  Private/Admin
router.put('/review/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'active'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Use approved or rejected.' });
    }

    const targetStatus = (status === 'approved' || status === 'active') ? 'active' : 'rejected';
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $set: { status: targetStatus } },
      { new: true }
    ).populate('submitter', 'name email');
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });

    res.json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Token Market Data (CoinGecko top coins for Token Analysis table) ───
// In-memory cache to avoid hitting rate limits
let tokenMarketCache = { data: null, ts: 0 };
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// @desc    Get top coins market data (CMC-style token analysis)
// @route   GET /api/tools/token-market
// @access  Public
router.get('/token-market', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.per_page) || 100, 250);
    const cacheKey = `${page}-${perPage}`;

    // Return cached data if fresh
    if (tokenMarketCache.data && tokenMarketCache.key === cacheKey && (Date.now() - tokenMarketCache.ts) < TOKEN_CACHE_TTL) {
      return res.json({ success: true, data: tokenMarketCache.data, cached: true });
    }

    const axios = require('axios');
    const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: perPage,
        page: page,
        sparkline: false,
        price_change_percentage: '1h,24h,7d'
      },
      timeout: 15000
    });

    const coins = data.map((coin, idx) => ({
      rank: (page - 1) * perPage + idx + 1,
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase(),
      image: coin.image,
      price: coin.current_price,
      priceChange1h: coin.price_change_percentage_1h_in_currency,
      priceChange24h: coin.price_change_percentage_24h_in_currency,
      priceChange7d: coin.price_change_percentage_7d_in_currency,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      ath: coin.ath,
      athChangePercentage: coin.ath_change_percentage,
      athDate: coin.ath_date,
      marketCapRank: coin.market_cap_rank,
      sentimentUpPercentage: coin.sentiment_votes_up_percentage != null
        ? Math.round(coin.sentiment_votes_up_percentage)
        : (coin.price_change_percentage_24h_in_currency != null
            ? Math.max(15, Math.min(95, Math.round(50 + Number(coin.price_change_percentage_24h_in_currency) * 3.5)))
            : 70)
    }));

    tokenMarketCache = { data: coins, ts: Date.now(), key: cacheKey };
    res.json({ success: true, data: coins });
  } catch (err) {
    console.error('Token market fetch error:', err.message);
    // Return stale cache if available
    if (tokenMarketCache.data) {
      return res.json({ success: true, data: tokenMarketCache.data, cached: true, stale: true });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch token market data' });
  }
});

// @desc    Vote bull or bear sentiment on a tool
// @route   POST /api/tools/:id/vote
// @access  Public
router.post('/:id/vote', async (req, res) => {
  try {
    const { type } = req.body; // 'bull' or 'bear'
    if (!['bull', 'bear'].includes(type)) {
      return res.status(400).json({ error: 'Invalid vote type. Use bull or bear.' });
    }

    // Generate a voter fingerprint from IP
    const voterIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const crypto = require('crypto');
    const voterId = crypto.createHash('sha256').update(voterIp).digest('hex').slice(0, 16);

    const tool = await Tool.findOne({ id: req.params.id });
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    // Initialize sentiment if missing
    if (!tool.sentiment) tool.sentiment = { bullish: [], bearish: [] };
    if (!Array.isArray(tool.sentiment.bullish)) tool.sentiment.bullish = [];
    if (!Array.isArray(tool.sentiment.bearish)) tool.sentiment.bearish = [];

    // Ensure clean unique voter IDs
    tool.sentiment.bullish = Array.from(new Set(tool.sentiment.bullish));
    tool.sentiment.bearish = Array.from(new Set(tool.sentiment.bearish));

    // Check if user already voted in either direction
    const alreadyBull = tool.sentiment.bullish.includes(voterId);
    const alreadyBear = tool.sentiment.bearish.includes(voterId);

    if (type === 'bull') {
      if (alreadyBull) {
        // Remove vote (toggle off)
        tool.sentiment.bullish = tool.sentiment.bullish.filter(v => v !== voterId);
      } else {
        // Remove from bear if switching, then add to bull
        tool.sentiment.bearish = tool.sentiment.bearish.filter(v => v !== voterId);
        tool.sentiment.bullish = Array.from(new Set([...tool.sentiment.bullish, voterId]));
      }
    } else {
      if (alreadyBear) {
        // Remove vote (toggle off)
        tool.sentiment.bearish = tool.sentiment.bearish.filter(v => v !== voterId);
      } else {
        // Remove from bull if switching, then add to bear
        tool.sentiment.bullish = tool.sentiment.bullish.filter(v => v !== voterId);
        tool.sentiment.bearish = Array.from(new Set([...tool.sentiment.bearish, voterId]));
      }
    }

    const lastUpdated = new Date();
    await Tool.updateOne(
      { id: req.params.id },
      {
        $set: {
          'sentiment.bullish': tool.sentiment.bullish,
          'sentiment.bearish': tool.sentiment.bearish,
          'sentiment.lastUpdated': lastUpdated
        }
      }
    );
    tool.sentiment.lastUpdated = lastUpdated;

    res.json({
      success: true,
      sentiment: {
        bullish: tool.sentiment.bullish.length,
        bearish: tool.sentiment.bearish.length,
        userVote: tool.sentiment.bullish.includes(voterId) ? 'bull' : tool.sentiment.bearish.includes(voterId) ? 'bear' : null,
        voterId
      }
    });
  } catch (err) {
    console.error('Sentiment vote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Increment click count for a tool (fire-and-forget analytics)
// @route   POST /api/tools/:id/click
// @access  Public
router.post('/:id/click', async (req, res) => {
  try {
    const tool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { clickCount: 1 } },
      { new: true, select: 'id clickCount' }
    );
    if (!tool) return res.status(404).json({ success: false });
    res.json({ success: true, clickCount: tool.clickCount });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// @desc    Full-text search across tools
// @route   GET /api/tools/search?q=
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) return res.json([]);

    // Escape special regex characters to prevent ReDoS
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const tools = await Tool.find({
      status: { $ne: 'rejected' },
      $or: [
        { name: regex },
        { description: regex },
        { category: regex },
        { tags: { $elemMatch: { $regex: regex } } }
      ]
    })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .limit(20)
      .lean();

    res.json(tools.map(decorateToolWithLogo));
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// @desc    Get top 5 apps per category (for Home page Top Charts tabs)
// @route   GET /api/tools/top-charts
// @access  Public
router.get('/top-charts', async (req, res) => {
  try {
    const tools = await Tool.find({ status: 'active' })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .lean();

    const grouped = tools.reduce((acc, tool) => {
      const cat = tool.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      if (acc[cat].length < 5) acc[cat].push(decorateToolWithLogo(tool));
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Common multi-service public platforms where parent-domain matching is blocked to avoid false positives
const PUBLIC_PLATFORMS = new Set([
  'google.com', 'github.com', 'twitter.com', 'x.com', 'discord.com',
  'vercel.app', 'github.io', 'gitbook.io', 'medium.com', 'substack.com',
  'notion.so', 'render.com', 'netlify.app', 'herokuapp.com', 'chromewebstore.google.com'
]);

// @desc    Verify safety of a domain (used by Scam Shield Chrome Extension)
// @route   GET /api/tools/verify-domain
// @access  Public
router.get('/verify-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain parameter is required' });
    }

    const cleanDomain = domain.toLowerCase().replace(/^www\./, '').trim();

    // Fetch all active tools
    const tools = await Tool.find({ status: 'active' }).lean();

    // 1. Direct safety check (exact hostname OR valid official subdomain/parent match)
    const matchedTool = tools.find(tool => {
      try {
        const toolUrl = new URL(tool.url);
        const officialDomain = toolUrl.hostname.toLowerCase().replace(/^www\./, '');
        // Match exact domain (uniswap.org) OR official subdomains (app.uniswap.org)
        // Allow parent domains ONLY if not a public suffix platform (e.g. uniswap.org matches app.uniswap.org but google.com does not match chromewebstore.google.com)
        return cleanDomain === officialDomain || 
               cleanDomain.endsWith(`.${officialDomain}`) || 
               (!PUBLIC_PLATFORMS.has(cleanDomain) && officialDomain.endsWith(`.${cleanDomain}`));
      } catch (e) {
        return false;
      }
    });

    if (matchedTool) {
      return res.json({
        success: true,
        status: 'verified',
        appName: matchedTool.name,
        officialUrl: matchedTool.url,
        rating: matchedTool.rating || 4.5,
        reviews: matchedTool.reviews || 0
      });
    }

    // 2. Proactive phishing copycat detection (Similarity Heuristic)
    // Suspicious if it contains the lowercase name of an app but isn't its official domain
    const suspiciousClone = tools.find(tool => {
      if (!tool.verified) return false;
      const cleanName = tool.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanName.length < 4) return false; // Ignore short names to prevent false positives

      try {
        const officialDomain = new URL(tool.url).hostname.toLowerCase().replace(/^www\./, '');
        const isOfficial = cleanDomain === officialDomain || 
                           cleanDomain.endsWith(`.${officialDomain}`) || 
                           (!PUBLIC_PLATFORMS.has(cleanDomain) && officialDomain.endsWith(`.${cleanDomain}`));
        const containsName = cleanDomain.includes(cleanName);
        return !isOfficial && containsName;
      } catch (e) {
        return false;
      }
    });

    if (suspiciousClone) {
      return res.json({
        success: true,
        status: 'phishing',
        appName: suspiciousClone.name,
        officialUrl: suspiciousClone.url,
        rating: suspiciousClone.rating || 4.5,
        reviews: suspiciousClone.reviews || 0
      });
    }

    // 3. Unlisted domain
    return res.json({
      success: true,
      status: 'unlisted'
    });
  } catch (err) {
    console.error('Domain safety verification error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// @desc    Get trending tools platform-wide
// @route   GET /api/tools/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const tools = await Tool.find({ status: 'active' })
      .sort({ weeklyTrendScore: -1, clickCount: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: tools.map(decorateToolWithLogo) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Developer claims ownership of a tool (pending admin approval)
// @route   POST /api/tools/:id/claim
// @access  Private
router.post('/:id/claim', protect, async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });
    if (!tool) return res.status(404).json({ error: 'App not found' });
    if (tool.developerClaimedBy) return res.status(400).json({ error: 'This app has already been claimed.' });

    await Tool.updateOne({ id: req.params.id }, { $set: { developerClaimPending: true } });
    tool.developerClaimPending = true;

    // Email admin for approval
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `🏷️ Developer Claim Request: ${tool.name}`,
          html: `<p>User <strong>${req.user.name}</strong> (${req.user.email}) has requested to claim <strong>${tool.name}</strong>.</p><p>Please review and approve in the Admin panel.</p>`
        });
      }
    } catch (e) { /* silent */ }

    res.json({ success: true, message: 'Claim request submitted. Our team will verify and approve within 24h.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Get developer dashboard analytics for authenticated user
// @route   GET /api/tools/developer/dashboard
// @access  Private
router.get('/developer/dashboard', protect, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    // Tools submitted by OR claimed by this user
    const tools = await Tool.find({
      $or: [
        { submitter: req.user.id },
        { developerClaimedBy: req.user.id }
      ]
    }).lean();

    const toolIds = tools.map(t => t.id);

    // Fetch all ratings for their tools
    const ratings = await Rating.find({ tool: { $in: toolIds } })
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Attach ratings summary to each tool
    const enriched = tools.map(tool => {
      const toolRatings = ratings.filter(r => r.tool === tool.id);
      const avgRating = toolRatings.length
        ? (toolRatings.reduce((s, r) => s + r.score, 0) / toolRatings.length).toFixed(1)
        : null;
      return {
        ...decorateToolWithLogo(tool),
        ratingCount: toolRatings.length,
        averageRating: avgRating ? parseFloat(avgRating) : null,
      };
    });

    res.json({ success: true, tools: enriched, ratings });
  } catch (err) {
    console.error('Developer dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Admin approves a developer claim
// @route   PUT /api/tools/:id/claim/approve
// @access  Private/Admin
router.put('/:id/claim/approve', protect, admin, async (req, res) => {
  try {
    const { userId } = req.body;
    const tool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { developerClaimedBy: userId, developerClaimPending: false },
      { new: true }
    );
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json({ success: true, tool });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all tools with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 500, 500);
    const skip = (page - 1) * limit;

    const [tools, total] = await Promise.all([
      Tool.find({}).skip(skip).limit(limit).lean(),
      Tool.countDocuments()
    ]);
    const decorated = tools.map(decorateToolWithLogo);

    // Group tools by category
    const toolsByCategory = decorated.reduce((acc, tool) => {
      const category = tool.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(tool);
      return acc;
    }, {});

    let responseData = { ...toolsByCategory, _meta: { total, page, limit } };

    try {
      const appsData = require('../../src/data/appsData');
      if (appsData.tooltipExplanations) {
        responseData.tooltipExplanations = appsData.tooltipExplanations;
      }
    } catch (e) {
      // Static config not available server-side
    }

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all tools belonging to the authenticated user
// IMPORTANT: This must be ABOVE /:category to avoid being matched as a category param
router.get('/my-tools', protect, async (req, res) => {
  try {
    const tools = await Tool.find({ submitter: req.user.id });
    res.json(tools.map(decorateToolWithLogo));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching my tools' });
  }
});

// Category alias map — maps new frontend keys to old DB category values
// If a key maps to an array, we query ALL of those DB categories
const CATEGORY_ALIASES = {
  infofi:          ['infofi'],
  trading:         ['dex', 'perps', 'trading'],
  bridges:         ['interoperability', 'bridges'],
  defi:            ['defi'],
  staking:         ['staking'],
  security:        ['security'],
  analytics:       ['analytics'],
  wallets:         ['wallets'],
  l2:              ['l2'],
  nft:             ['nft'],
  gaming:          ['gaming'],
  privacy:         ['privacy'],
  predictions:     ['predictions'],
  community:       ['communityTools', 'community'],
  'bounty-hub':    ['bountyHub', 'bounty-hub'],
  'rwa':           ['rwa'],
  cex:             ['cex'],
  // Legacy keys still work directly
  dex:             ['dex'],
  perps:           ['perps'],
  interoperability:['interoperability'],
  communityTools:  ['communityTools'],
  bountyHub:       ['bountyHub'],
};

// GET tools by category
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const aliases = CATEGORY_ALIASES[category] || [category];
    const tools = await Tool.find({ category: { $in: aliases } });
    res.json(tools.map(decorateToolWithLogo));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const axios = require('axios');

// POST a new tool (Public Submission)
router.post('/submit', protect, async (req, res) => {
  try {
    const { name, link, category, chain, handle, builderHandle, description, auditLink, twitter, discord, telegram, contractAddresses, githubRepo } = req.body;
    const submitHandle = handle || builderHandle || '';

    // Generate a slug-like ID from the name
    const toolId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if ID already exists
    const existingTool = await Tool.findOne({ id: toolId });
    if (existingTool) {
      return res.status(400).json({ error: 'A tool with a similar name already exists.' });
    }

    // Auto-Verification Logic (Tier 1: DefiLlama)
    let verified = false;
    let verificationTier = 4; // Default: Manual
    let metrics = { lastUpdated: new Date() };

    try {
      const llamaRes = await axios.get(`https://api.llama.fi/protocol/${toolId}`, { timeout: 5000 });
      if (llamaRes.data && llamaRes.data.slug) {
        verified = true;
        verificationTier = 1;
        const p = llamaRes.data;
        metrics = {
          tvl: p.tvl?.[p.tvl.length - 1]?.totalTvl || 0,
          chains: p.chains || [chain],
          lastUpdated: new Date()
        };
      }
    } catch (err) {
      // Not found or error: stay unverified (Tier 4)
    }

    // Fetch initial GitHub commits if repository handle is provided
    let commits30d = 0;
    if (githubRepo && githubRepo.trim()) {
      try {
        const { fetchGitHubCommits } = require('../services/githubService');
        commits30d = await fetchGitHubCommits(githubRepo);
      } catch (e) {
        console.warn(`[Submit] Pre-fetching commits for ${githubRepo} failed:`, e.message);
      }
    }

    const derivedLogo = deriveToolLogo({
      name,
      url: link,
      builder: {
        handle: submitHandle,
        twitter: submitHandle ? `https://x.com/${String(submitHandle).replace(/^@/, '')}` : ''
      }
    });

    const newTool = await Tool.create({
      id: toolId,
      name,
      url: link,
      category,
      description,
      auditLink,
      verificationTier,
      verified,
      builder: {
        name: submitHandle || 'Anonymous',
        handle: submitHandle,
        twitter: twitter ? (twitter.startsWith('http') ? twitter : `https://x.com/${twitter.replace(/^@/, '')}`) : '',
        discord: discord || '',
        telegram: telegram || ''
      },
      submitter: req.user.id,
      status: 'pending',
      metrics: metrics,
      logoUrl: derivedLogo.logoUrl,
      logoSource: derivedLogo.logoSource,
      contractAddresses: Array.isArray(contractAddresses) ? contractAddresses.filter(c => c.address && c.address.trim()) : [],
      githubRepo: githubRepo || '',
      githubCommits: {
        count30d: commits30d,
        lastUpdated: new Date()
      }
    });

    // Send email notification
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `${verified ? '✅ Verified' : '🔧 New'} Submission: ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${verified ? '#059669, #10b981' : '#1e293b, #312e81'}); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0;">${verified ? '✅ Auto-Verified' : '🔧 New Submission'}</h2>
                <p style="color: white; opacity: 0.8; margin: 8px 0 0;">${verified ? 'Protocol matched on DefiLlama' : 'Pending manual review'}</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Category</td><td style="padding: 8px 0;">${category}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Chain</td><td style="padding: 8px 0;">${chain} ${verified ? ' (Verified)' : ''}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Handle</td><td style="padding: 8px 0;">${submitHandle || 'Anonymous'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">URL</td><td style="padding: 8px 0;"><a href="${link}" style="color: #4f46e5;">${link}</a></td></tr>
                  ${auditLink ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Audit</td><td style="padding: 8px 0;"><a href="${auditLink}" style="color: #4f46e5;">Link</a></td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Description</td><td style="padding: 8px 0;">${description}</td></tr>
                </table>
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    ${verified ? 'View in Dashboard' : 'Review in Admin Panel'}
                  </a>
                </div>
              </div>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error("Failed to send notification email:", emailErr.message);
    }

    res.status(201).json({ 
      success: true,
      message: verified ? 'Protocol verified and submitted.' : 'Tool submitted for review.', 
      tool: newTool 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST a new tool (Admin creation via JWT)
// @access  Private/Admin
router.post('/:category', protect, admin, async (req, res) => {
  try {
    const category = req.params.category;
    const toolData = req.body;

    // Ensure category matches param
    toolData.category = category;

    // Auto-generate missing required fields from Admin UI payload
    if (!toolData.id) {
      toolData.id = toolData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (!toolData.builder) {
      toolData.builder = {
        name: 'Web3Central Admin',
        twitter: toolData.twitter || ''
      };
    }

    const derivedLogo = deriveToolLogo({
      ...toolData,
      category,
      url: toolData.url,
    });

    if (derivedLogo.logoUrl) {
      toolData.logoUrl = derivedLogo.logoUrl;
      toolData.logoSource = derivedLogo.logoSource;
    }

    // Check if ID exists
    const existingTool = await Tool.findOne({ id: toolData.id });
    if (existingTool) {
      return res.status(400).json({ error: 'Tool ID already exists' });
    }

    const newTool = await Tool.create(toolData);
    res.status(201).json({ message: 'Tool added successfully', tool: newTool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT review a submitted tool
// @access  Private/Admin
router.put('/:category/:id/review', protect, admin, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { action, reason } = req.body; // action: 'accept' or 'reject'

    const tool = await Tool.findOne({ id }).populate('submitter', 'name email');
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (action === 'accept') {
      tool.status = 'active';
    } else if (action === 'reject') {
      tool.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action. Use accept or reject.' });
    }

    await Tool.updateOne({ id }, { $set: { status: tool.status } });

    // Send notification email to the submitter if their email is available
    if (tool.submitter && tool.submitter.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const subject = action === 'accept' ? `🎉 Your tool ${tool.name} has been approved!` : `Update on your tool submission: ${tool.name}`;

        let htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b, #312e81); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">Tool Submission Status Update</h2>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
              <p>Hi ${tool.submitter.name},</p>
        `;

        if (action === 'accept') {
          htmlBody += `
              <p>Great news! Your submission for <strong>${tool.name}</strong> has been reviewed and approved by our moderation team.</p>
              <p>It is now live on the platform under the ${tool.category} category.</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View the Hub</a>
              </div>
          `;
        } else {
          htmlBody += `
              <p>Thank you for submitting <strong>${tool.name}</strong> to our platform.</p>
              <p>Unfortunately, your submission has been declined at this time. ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}</p>
              <p>If you have any questions or have updated your protocol, you are welcome to submit again in the future.</p>
          `;
        }

        htmlBody += `
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Web3Central" <${process.env.SMTP_USER}>`,
          to: tool.submitter.email,
          subject: subject,
          html: htmlBody
        });
        console.log(`Review notification sent to ${tool.submitter.email}`);
      } catch (emailErr) {
        console.error("Failed to send review notification email:", emailErr.message);
      }
    }

    res.json({ message: `Tool ${action}ed successfully`, tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT (update) a tool
// @access  Private (admin or tool owner)
router.put('/:category/:id', protect, async (req, res) => {
  try {
    const { category, id } = req.params;
    const rawData = req.body;

    const existingTool = await Tool.findOne({ id });
    if (!existingTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Check authorization: must be admin OR matching developer
    const isAdmin = req.user.role === 'admin';
    const isDeveloper = (existingTool.developerClaimedBy && String(existingTool.developerClaimedBy) === String(req.user.id)) ||
                        (existingTool.submitter && String(existingTool.submitter) === String(req.user.id));

    if (!isAdmin && !isDeveloper) {
      return res.status(403).json({ error: 'You are not authorized to update this tool' });
    }

    // Whitelist allowed fields — prevent mass assignment of verified, status, submitter, etc.
    const ADMIN_FIELDS = ['status', 'verified', 'verificationTier', 'featured', 'weeklyTrendScore', 'tags', 'metrics', 'logoUrl', 'logoSource'];
    const DEV_FIELDS = ['name', 'description', 'url', 'airdropUrl', 'auditLink', 'isTestnet', 'builder', 'contractAddresses', 'githubRepo'];
    const allowedFields = isAdmin ? [...DEV_FIELDS, ...ADMIN_FIELDS] : DEV_FIELDS;

    const updateData = {};
    for (const field of allowedFields) {
      if (rawData[field] !== undefined) updateData[field] = rawData[field];
    }

    // Pre-fetch commits if githubRepo was changed or added
    if (updateData.githubRepo && updateData.githubRepo !== existingTool.githubRepo) {
      try {
        const { fetchGitHubCommits } = require('../services/githubService');
        const commitCount = await fetchGitHubCommits(updateData.githubRepo);
        updateData.githubCommits = {
          count30d: commitCount,
          lastUpdated: new Date()
        };
      } catch (e) {
        console.warn(`[Update] Pre-fetching commits for ${updateData.githubRepo} failed:`, e.message);
      }
    }

    const mergedForLogo = {
      ...existingTool.toObject(),
      ...updateData,
      builder: {
        ...(existingTool.builder || {}),
        ...(updateData.builder || {})
      }
    };

    const derivedLogo = deriveToolLogo(mergedForLogo);
    if (derivedLogo.logoUrl) {
      updateData.logoUrl = derivedLogo.logoUrl;
      updateData.logoSource = derivedLogo.logoSource;
    }

    const updatedTool = await Tool.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Tool updated successfully', tool: updatedTool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a tool
// @access  Private/Admin
router.delete('/:category/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTool = await Tool.findOneAndDelete({ id });

    if (!deletedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ message: 'Tool deleted successfully', tool: deletedTool });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Apply to join a DAO
// @route   POST /api/tools/daos/:id/apply
// @access  Private
const DaoApplication = require('../models/DaoApplication');

router.post('/daos/:id/apply', protect, async (req, res) => {
  try {
    const { talent, valueAdd, portfolio } = req.body;

    // Verify the tool exists and is a DAO
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });
    if (tool.category !== 'dao') {
      return res.status(400).json({ success: false, error: 'This tool is not a DAO' });
    }

    const application = await DaoApplication.create({
      dao: tool._id,
      user: req.user.id,
      talent,
      valueAdd,
      portfolio
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    // Handle duplicate application (unique index on dao + user)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'You have already applied to this DAO' });
    }
    console.error('DAO application error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;