const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');
const appsData = require('../../src/data/appsData');
const { GECKO_MAP } = require('../services/llamaService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const EXTRA_TOKEN_MAP = {
  wormhole: 'wormhole',
  '0x': '0x',
  'level-finance': 'level-governance',
  'rollbit-perps': 'rollbit-coin',
  zkx: 'zkx'
};

const TOKEN_MAP = { ...GECKO_MAP, ...EXTRA_TOKEN_MAP };

const flattenStaticTools = () => {
  const tools = [];
  for (const value of Object.values(appsData)) {
    if (Array.isArray(value)) {
      for (const tool of value) {
        if (tool && tool.id) tools.push(tool);
      }
    }
  }
  return tools;
};

const normalize = (s = '') => String(s || '').trim().toLowerCase();

(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const staticTools = flattenStaticTools();
  const staticById = new Map(staticTools.map((t) => [t.id, t]));
  const staticByName = new Map(staticTools.map((t) => [normalize(t.name), t]));

  const dbTools = await Tool.find({}, {
    id: 1,
    name: 1,
    category: 1,
    monthlyUsers: 1,
    rating: 1,
    reviews: 1,
    popularWith: 1,
    geckoId: 1,
    status: 1,
    verified: 1
  }).lean();

  let matched = 0;
  let updated = 0;
  const bulkOps = [];

  for (const dbTool of dbTools) {
    const staticTool = staticById.get(dbTool.id) || staticByName.get(normalize(dbTool.name));
    const next = {};

    if (staticTool) {
      matched += 1;
      if (!dbTool.monthlyUsers && staticTool.monthlyUsers) next.monthlyUsers = staticTool.monthlyUsers;
      if ((!dbTool.rating || dbTool.rating <= 0) && typeof staticTool.rating === 'number') next.rating = staticTool.rating;
      if ((!dbTool.reviews || dbTool.reviews <= 0) && typeof staticTool.reviews === 'number') next.reviews = staticTool.reviews;
      if ((!Array.isArray(dbTool.popularWith) || dbTool.popularWith.length === 0) && Array.isArray(staticTool.popularWith)) {
        next.popularWith = staticTool.popularWith;
      }
      if (dbTool.category !== staticTool.category && staticTool.category) {
        next.category = staticTool.category;
      }
      if (dbTool.verified == null && typeof staticTool.verified === 'boolean') {
        next.verified = staticTool.verified;
      }
      if (!dbTool.status && staticTool.status) {
        next.status = staticTool.status;
      }
    }

    if (!dbTool.geckoId && TOKEN_MAP[dbTool.id]) {
      next.geckoId = TOKEN_MAP[dbTool.id];
    }

    // Hard business rule from migration
    if (/sol\s*wallet\s*cleaner/i.test(dbTool.name) || /twitter\s*video\s*downloader/i.test(dbTool.name)) {
      next.category = 'communityTools';
    }

    if (Object.keys(next).length > 0) {
      updated += 1;
      bulkOps.push({
        updateOne: {
          filter: { _id: dbTool._id },
          update: { $set: next }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await Tool.bulkWrite(bulkOps);
  }

  console.log(`Backfill complete. DB tools: ${dbTools.length}, static matches: ${matched}, docs updated: ${updated}`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('backfillToolMetadata failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
