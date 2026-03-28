const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Tool = require('../models/Tool');
const { GECKO_MAP } = require('../services/llamaService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const includeAllStatuses = process.argv.includes('--all');

const CATEGORY_ALIASES = {
  dex: 'trading',
  perps: 'trading',
  web3chat: 'trading',
  trading: 'trading',
  interoperability: 'bridges',
  bridge: 'bridges',
  bridges: 'bridges',
  communitytools: 'community',
  community: 'community',
  security: 'security',
  analytics: 'analytics',
  infofi: 'analytics',
  researchfiles: 'analytics',
  wallets: 'wallets',
  wallet: 'wallets',
  nft: 'nft',
  defi: 'defi',
  staking: 'staking',
  rwa: 'rwa',
  l2: 'l2',
  onchainautonomy: 'onchain',
  vibecoding: 'community',
};

const CATEGORY_METRIC_POLICY = {
  trading: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating', 'reviews'],
  bridges: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  defi: ['tvl', 'volume24h', 'staking', 'pool2', 'tokenPrice', 'mcap', 'fdv', 'chains', 'rating'],
  staking: ['staking', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'pool2', 'chains', 'rating'],
  wallets: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'chains', 'reviews'],
  nft: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'chains', 'reviews'],
  analytics: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  security: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  community: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  l2: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  rwa: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  onchain: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  default: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'reviews', 'chains']
};

const normalizeCategory = (category = '') => String(category || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const parseUsers = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = String(value).replace(/[^\d]/g, '');
  if (!parsed) return 0;
  const num = Number(parsed);
  return Number.isFinite(num) ? num : 0;
};

const hasMetricValue = (tool, key, hasTokenKnown) => {
  const m = tool.metrics || {};
  switch (key) {
    case 'tvl': return Number(m.tvl) > 0;
    case 'volume24h': return Number(m.volume24h) > 0;
    case 'staking': return Number(m.staking) > 0;
    case 'pool2': return Number(m.pool2) > 0;
    case 'mcap': return hasTokenKnown || Number(m.mcap) > 0;
    case 'fdv': return hasTokenKnown || Number(m.fdv) > 0;
    case 'tokenPrice': return hasTokenKnown || Number(m.tokenPrice) > 0;
    case 'chains': return Array.isArray(m.chains) && m.chains.length > 0;
    case 'monthlyUsers': return parseUsers(tool.monthlyUsers) > 0;
    case 'rating': return Number(tool.rating) > 0;
    case 'reviews': return Number(tool.reviews) > 0;
    default: return false;
  }
};

const buildSelectedMetrics = (tool) => {
  const normalized = normalizeCategory(tool.category);
  const group = CATEGORY_ALIASES[normalized] || 'default';
  const order = CATEGORY_METRIC_POLICY[group] || CATEGORY_METRIC_POLICY.default;
  const hasTokenKnown = Boolean(tool.geckoId || GECKO_MAP[tool.id]);

  const selected = [];
  for (const key of order) {
    if (hasMetricValue(tool, key, hasTokenKnown)) {
      selected.push(key);
    }
    if (selected.length >= 4) break;
  }

  return {
    group,
    hasTokenKnown,
    selected
  };
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const findFilter = includeAllStatuses
    ? {}
    : {
        $or: [
          { status: 'active' },
          { status: 'experimental' },
          { status: { $exists: false } },
          { status: null }
        ]
      };

  const tools = await Tool.find(findFilter, {
    id: 1,
    name: 1,
    category: 1,
    status: 1,
    geckoId: 1,
    monthlyUsers: 1,
    rating: 1,
    reviews: 1,
    metrics: 1
  }).lean();

  const rows = tools.map((tool) => {
    const { group, hasTokenKnown, selected } = buildSelectedMetrics(tool);
    return {
      id: tool.id,
      name: tool.name,
      category: tool.category,
      policyGroup: group,
      geckoId: tool.geckoId || GECKO_MAP[tool.id] || null,
      hasTokenKnown,
      selectedMetrics: selected,
      metricCount: selected.length
    };
  });

  const byCategory = rows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = { total: 0, fullCoverage: 0, partialCoverage: 0, missing: 0 };
    }
    acc[row.category].total += 1;
    if (row.metricCount >= 4) acc[row.category].fullCoverage += 1;
    else if (row.metricCount > 0) acc[row.category].partialCoverage += 1;
    else acc[row.category].missing += 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    scope: includeAllStatuses ? 'all-statuses' : 'active-surface-only',
    summary: {
      totalTools: rows.length,
      fullCoverage: rows.filter((r) => r.metricCount >= 4).length,
      partialCoverage: rows.filter((r) => r.metricCount > 0 && r.metricCount < 4).length,
      missingCoverage: rows.filter((r) => r.metricCount === 0).length,
    },
    byCategory,
    rows: rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  };

  const outPath = path.join(__dirname, '../data/metricsCoverageReport.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Metrics coverage report written to: ${outPath}`);
  console.log(`Tools: ${report.summary.totalTools}, Full: ${report.summary.fullCoverage}, Partial: ${report.summary.partialCoverage}, Missing: ${report.summary.missingCoverage}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Failed to generate metrics coverage report:', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
