const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');
const appsData = require('../../src/data/appsData');

dotenv.config({ path: path.join(__dirname, '../.env') });

const shouldApply = process.argv.includes('--apply');

const archiveReportPath = path.join(__dirname, '../data/archiveLegacyDryRun.json');

const flattenStaticTools = () => {
  const items = [];
  for (const value of Object.values(appsData)) {
    if (Array.isArray(value)) {
      for (const tool of value) {
        if (tool?.id) items.push(tool);
      }
    }
  }
  return items;
};

const normalize = (v = '') => String(v || '').trim().toLowerCase();
const staticTools = flattenStaticTools();
const staticById = new Map(staticTools.map((t) => [t.id, t]));
const staticByName = new Map(staticTools.map((t) => [normalize(t.name), t]));

const CATEGORY_OVERRIDES = {
  'sol-wallet-cleaner-claim-your-sol': 'communityTools',
  'twitter-video-downloader': 'communityTools',
};

const inferCategory = (tool) => {
  const byId = staticById.get(tool.id);
  if (byId?.category) return byId.category;

  const byName = staticByName.get(normalize(tool.name));
  if (byName?.category) return byName.category;

  if (CATEGORY_OVERRIDES[tool.id]) return CATEGORY_OVERRIDES[tool.id];

  const text = [tool.id, tool.name, tool.description, tool.url, ...(tool.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/perp|futures|derivative/.test(text)) return 'perps';
  if (/dex|swap|exchange|amm|lp\b|liquidity/.test(text)) return 'dex';
  if (/bridge|cross[-\s]?chain|interoperab/.test(text)) return 'interoperability';
  if (/wallet|seed phrase|phantom|metamask|ledger|trezor/.test(text)) return 'wallets';
  if (/security|audit|scam|revoke|guard|shield|drain|exploit/.test(text)) return 'security';
  if (/analytics|dashboard|tracker|intel|research|insight|dune|nansen/.test(text)) return 'analytics';
  if (/nft|opensea|magic eden|zora/.test(text)) return 'nft';
  if (/game|gaming|gamefi|axie|sandbox|guild/.test(text)) return 'gaming';
  if (/privacy|zk|railgun|secret network/.test(text)) return 'privacy';
  if (/prediction|polymarket|augur|omen/.test(text)) return 'predictions';
  if (/grant|bounty|quest|earn/.test(text)) return 'bountyHub';
  if (/automation|autonom|agent|bot|scheduler/.test(text)) return 'onchainAutonomy';
  if (/l2|rollup|arbitrum|optimism|base\b|zk\s?sync/.test(text)) return 'l2';
  if (/rwa|real world asset/.test(text)) return 'rwa';
  if (/yield|lending|borrow|stake|farm|stablecoin|defi/.test(text)) return 'defi';

  return 'communityTools';
};

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in backend/.env');
  if (!fs.existsSync(archiveReportPath)) throw new Error('archiveLegacyDryRun.json not found');

  const archiveReport = JSON.parse(fs.readFileSync(archiveReportPath, 'utf8'));
  const candidateIds = (archiveReport.candidates || []).map((c) => c._id).filter(Boolean);

  await mongoose.connect(process.env.MONGODB_URI);

  const tools = await Tool.find({ _id: { $in: candidateIds } }, {
    id: 1,
    name: 1,
    description: 1,
    url: 1,
    tags: 1,
    category: 1,
    status: 1,
  }).lean();

  const planned = tools.map((tool) => {
    const newCategory = inferCategory(tool);
    return {
      _id: tool._id,
      id: tool.id,
      name: tool.name,
      oldCategory: tool.category,
      newCategory,
      oldStatus: tool.status,
      newStatus: 'active',
    };
  });

  const byCategory = planned.reduce((acc, p) => {
    acc[p.newCategory] = (acc[p.newCategory] || 0) + 1;
    return acc;
  }, {});

  if (shouldApply) {
    const bulkOps = planned.map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            category: p.newCategory,
            status: 'active',
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await Tool.bulkWrite(bulkOps);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    restoredCount: planned.length,
    byCategory,
    sample: planned.slice(0, 50),
  };

  const outPath = path.join(__dirname, '../data/restoreArchivedResult.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`${shouldApply ? 'Restored' : 'Would restore'} ${planned.length} archived tools.`);
  console.log('Category distribution:', byCategory);
  console.log(`Report: ${outPath}`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('restoreArchivedAndCategorize failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
