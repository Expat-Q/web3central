const fs = require('fs');
const path = require('path');
const appsData = require('../../src/data/appsData');
const { GECKO_MAP } = require('../services/llamaService');

const EXTRA_TOKEN_MAP = {
  wormhole: 'wormhole',
  '0x': '0x',
  'level-finance': 'level-governance',
  'rollbit-perps': 'rollbit-coin',
  zkx: 'zkx'
};

const TOKEN_MAP = { ...GECKO_MAP, ...EXTRA_TOKEN_MAP };

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

const hasValue = (tool, key, hasToken) => {
  const m = tool.metrics || {};
  switch (key) {
    case 'tvl': return Number(m.tvl) > 0;
    case 'volume24h': return Number(m.volume24h) > 0;
    case 'staking': return Number(m.staking) > 0;
    case 'pool2': return Number(m.pool2) > 0;
    case 'mcap':
    case 'fdv':
    case 'tokenPrice': return hasToken;
    case 'chains': return Array.isArray(m.chains) && m.chains.length > 0;
    case 'monthlyUsers': return parseUsers(tool.monthlyUsers) > 0;
    case 'rating': return Number(tool.rating) > 0;
    case 'reviews': return Number(tool.reviews || tool.ratingCount) > 0;
    default: return false;
  }
};

const allTools = Object.entries(appsData)
  .filter(([, v]) => Array.isArray(v))
  .flatMap(([, arr]) => arr)
  .filter((t) => t?.id);

const rows = allTools.map((tool) => {
  const normalized = normalizeCategory(tool.category);
  const group = CATEGORY_ALIASES[normalized] || 'default';
  const order = CATEGORY_METRIC_POLICY[group] || CATEGORY_METRIC_POLICY.default;
  const hasToken = Boolean(TOKEN_MAP[tool.id]);

  const selected = [];
  for (const metric of order) {
    if (hasValue(tool, metric, hasToken)) selected.push(metric);
    if (selected.length >= 4) break;
  }

  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    policyGroup: group,
    geckoId: TOKEN_MAP[tool.id] || null,
    hasToken,
    selectedMetrics: selected,
    metricCount: selected.length
  };
});

const summary = {
  totalTools: rows.length,
  withKnownToken: rows.filter((r) => r.hasToken).length,
  fullCoverage: rows.filter((r) => r.metricCount >= 4).length,
  partialCoverage: rows.filter((r) => r.metricCount > 0 && r.metricCount < 4).length,
  missingCoverage: rows.filter((r) => r.metricCount === 0).length,
};

const byCategory = rows.reduce((acc, row) => {
  if (!acc[row.category]) {
    acc[row.category] = { total: 0, tokenized: 0, fullCoverage: 0, partialCoverage: 0, missing: 0 };
  }
  acc[row.category].total += 1;
  if (row.hasToken) acc[row.category].tokenized += 1;
  if (row.metricCount >= 4) acc[row.category].fullCoverage += 1;
  else if (row.metricCount > 0) acc[row.category].partialCoverage += 1;
  else acc[row.category].missing += 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  source: 'src/data/appsData.js',
  summary,
  byCategory,
  rows: rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
};

const outPath = path.join(__dirname, '../data/metricsCoverageStatic.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Static metrics coverage written to: ${outPath}`);
console.log(`Tools: ${summary.totalTools} | tokenized: ${summary.withKnownToken} | full: ${summary.fullCoverage} | partial: ${summary.partialCoverage} | missing: ${summary.missingCoverage}`);
