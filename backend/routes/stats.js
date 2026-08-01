const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tool = require('../models/Tool');
const Rating = require('../models/Rating');
const { asyncHandler } = require('../errors');
const { protect, admin } = require('../middleware/auth');

// Flag mapping for real user countries
const COUNTRY_FLAGS = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'Nigeria': '🇳🇬',
  'Japan': '🇯🇵',
  'Canada': '🇨🇦',
  'France': '🇫🇷',
  'Singapore': '🇸🇬',
  'Australia': '🇦🇺',
  'Brazil': '🇧🇷',
  'India': '🇮🇳',
  'Vietnam': '🇻🇳',
  'China': '🇨🇳',
  'South Korea': '🇰🇷',
  'Netherlands': '🇳🇱'
};

// @route   GET /api/stats/overview
router.get('/overview', protect, admin, asyncHandler(async (req, res) => {
  const [totalUsers, activeTools, pendingTools, verifiedTools, totalTools, clickStats] = await Promise.all([
    User.countDocuments(),
    Tool.countDocuments({ status: { $in: ['active', 'experimental'] } }),
    Tool.countDocuments({ status: 'pending' }),
    Tool.countDocuments({ verified: true }),
    Tool.countDocuments(),
    Tool.aggregate([{ $group: { _id: null, totalClicks: { $sum: '$clickCount' } } }])
  ]);

  const totalClicks = clickStats[0]?.totalClicks || 0;

  res.json({
    success: true,
    users: totalUsers,
    activeTools: activeTools || totalTools,
    pendingTools: pendingTools,
    verifiedTools: verifiedTools,
    totalTools: totalTools,
    totalClicks: totalClicks,
  });
}));

// @route   GET /api/stats/users
// @desc    Get real registered user list with country data from MongoDB
router.get('/users', protect, admin, asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });

  const formattedUsers = users.map((u) => {
    const countryName = u.country || 'Global / Unspecified';
    const flag = COUNTRY_FLAGS[countryName] || '🌐';
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      country: countryName,
      countryCode: u.countryCode || 'GLOBAL',
      flag: flag,
      createdAt: u.createdAt,
      totalXP: u.totalXP || 0,
      diamonds: u.diamonds || 0,
      rank: u.rank || 'Member',
      savedToolsCount: u.savedTools?.length || 0,
      avatarUrl: u.avatarUrl || ''
    };
  });

  res.json({
    success: true,
    total: formattedUsers.length,
    users: formattedUsers
  });
}));

// @route   GET /api/stats/traffic
// @desc    Get real website visitor rate & interaction analytics from database
router.get('/traffic', protect, admin, asyncHandler(async (req, res) => {
  const [totalUsers, totalTools, ratingsCount, clickAgg, countryAgg] = await Promise.all([
    User.countDocuments(),
    Tool.countDocuments(),
    Rating ? Rating.countDocuments().catch(() => 0) : 0,
    Tool.aggregate([{ $group: { _id: null, totalClicks: { $sum: '$clickCount' } } }]),
    User.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const totalClicks = clickAgg[0]?.totalClicks || 0;

  // Calculate real country breakdown from user registrations
  const totalUserCount = totalUsers || 1;
  const countryBreakdown = countryAgg.map(item => {
    const cName = item._id || 'Global / Unspecified';
    const pct = Math.round((item.count / totalUserCount) * 100);
    return {
      country: cName,
      code: cName.slice(0, 2).toUpperCase(),
      flag: COUNTRY_FLAGS[cName] || '🌐',
      visits: item.count,
      share: `${pct}%`
    };
  });

  res.json({
    success: true,
    visitorRate: {
      totalInteractions: totalClicks + ratingsCount,
      protocolClicks: totalClicks,
      registeredUsers: totalUsers,
      totalIndexedProtocols: totalTools,
      reviewsSubmitted: ratingsCount
    },
    countryBreakdown: countryBreakdown.length > 0 ? countryBreakdown : [
      { country: 'Global / Unspecified', code: 'GLOBAL', flag: '🌐', visits: totalUsers, share: '100%' }
    ]
  });
}));

// @route   GET /api/stats/inventory
// @desc    Get all protocols organized neatly by category
router.get('/inventory', protect, admin, asyncHandler(async (req, res) => {
  const tools = await Tool.find().sort({ name: 1 });
  
  const categoryMap = {};
  for (const t of tools) {
    const cat = t.category || 'other';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push({
      _id: t._id,
      id: t.id,
      name: t.name,
      category: t.category,
      status: t.status || 'active',
      verified: !!t.verified,
      logoUrl: t.logoUrl,
      url: t.url,
      rating: t.averageRating || t.rating || 0,
      ratingCount: t.ratingCount || 0,
      tvl: t.metrics?.tvl || 0,
      mcap: t.metrics?.mcap || 0,
      volume24h: t.metrics?.volume24h || 0,
      chains: t.metrics?.chains || []
    });
  }

  res.json({
    success: true,
    totalProtocols: tools.length,
    categoriesCount: Object.keys(categoryMap).length,
    categories: categoryMap
  });
}));

module.exports = router;
