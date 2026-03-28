const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');
const appsData = require('../../src/data/appsData');

dotenv.config({ path: path.join(__dirname, '../.env') });

const shouldApply = process.argv.includes('--apply');

const STATIC_IDS = new Set(
  Object.values(appsData)
    .filter(Array.isArray)
    .flat()
    .map((t) => t.id)
    .filter(Boolean)
);

const parseUsers = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = String(value).replace(/[^\d]/g, '');
  if (!parsed) return 0;
  const n = Number(parsed);
  return Number.isFinite(n) ? n : 0;
};

const hasOnchainSignal = (tool) => {
  const m = tool.metrics || {};
  return (
    Number(m.tvl) > 0 ||
    Number(m.volume24h) > 0 ||
    Number(m.mcap) > 0 ||
    Number(m.fdv) > 0 ||
    Number(m.tokenPrice) > 0 ||
    (Array.isArray(m.chains) && m.chains.length > 0)
  );
};

const hasUsageSignal = (tool) => {
  return (
    parseUsers(tool.monthlyUsers) > 0 ||
    Number(tool.rating) > 0 ||
    Number(tool.reviews) > 0 ||
    (Array.isArray(tool.popularWith) && tool.popularWith.length > 0)
  );
};

const LEGACY_NAME_RX = /(test|demo|sample|temp|backup|moderation)/i;

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  await mongoose.connect(process.env.MONGODB_URI);

  const tools = await Tool.find(
    { status: { $ne: 'disabled' } },
    {
      id: 1,
      name: 1,
      category: 1,
      status: 1,
      monthlyUsers: 1,
      rating: 1,
      reviews: 1,
      popularWith: 1,
      geckoId: 1,
      llamaSlug: 1,
      metrics: 1,
    }
  ).lean();

  const candidates = [];

  for (const tool of tools) {
    const inStatic = STATIC_IDS.has(tool.id);
    if (inStatic) continue;

    const onchain = hasOnchainSignal(tool);
    const usage = hasUsageSignal(tool);
    const hasResolverHints = Boolean(tool.geckoId || tool.llamaSlug);
    const legacyName = LEGACY_NAME_RX.test(tool.name || '') || LEGACY_NAME_RX.test(tool.id || '');

    const stale = (!onchain && !usage && !hasResolverHints) || legacyName;

    if (stale) {
      candidates.push({
        _id: tool._id,
        id: tool.id,
        name: tool.name,
        category: tool.category,
        status: tool.status,
        reasons: {
          noOnchainSignal: !onchain,
          noUsageSignal: !usage,
          noResolverHints: !hasResolverHints,
          legacyName,
          notInStaticCatalog: true,
        },
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    scannedTools: tools.length,
    staticCatalogSize: STATIC_IDS.size,
    archiveCandidateCount: candidates.length,
    candidates,
  };

  const reportPath = path.join(__dirname, '../data/archiveLegacyDryRun.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (shouldApply && candidates.length > 0) {
    const ids = candidates.map((c) => c._id);
    const updateRes = await Tool.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'disabled' } }
    );
    console.log(`Archived ${updateRes.modifiedCount} legacy low-data tools (status=disabled).`);
  } else {
    console.log(`Dry run: ${candidates.length} legacy low-data tools would be archived.`);
  }

  console.log(`Report: ${reportPath}`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('archiveLegacyLowData failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
