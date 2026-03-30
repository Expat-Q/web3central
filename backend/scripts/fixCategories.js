/**
 * fixCategories.js
 *
 * Recategorizes all tools in MongoDB to match the canonical taxonomy
 * defined in apps-category.md.
 *
 * Usage:
 *   node scripts/fixCategories.js           # Dry run — prints planned changes, no DB writes
 *   node scripts/fixCategories.js --apply   # Applies changes to MongoDB
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const shouldApply = process.argv.includes('--apply');

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE OF TRUTH: app name → canonical DB category tag
// Derived from apps-category.md
// Trading apps: DEX aggregators/AMMs → 'dex', Perps/derivatives → 'perps'
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  // ── InfoFi ──
  'bantr':                        'infofi',
  'cookie':                       'infofi',
  'elsa':                         'infofi',
  'galxe starboard':              'infofi',
  'kaito':                        'infofi',
  'kaito radar':                  'infofi',
  'wallchain':                    'infofi',
  'xeet':                         'infofi',

  // ── Bounty ──
  'cre8core labs':                'bounty-hub',
  'enb ecosystem':                'bounty-hub',
  'first dollar':                 'bounty-hub',
  'gib.work':                     'bounty-hub',
  'onboard3':                     'bounty-hub',
  'scribble':                     'bounty-hub',
  'stallion':                     'bounty-hub',
  'superteam earn':               'bounty-hub',
  'tunnl':                        'bounty-hub',
  'wizz':                         'bounty-hub',
  'wpl':                          'bounty-hub',

  // ── Community ──
  'blix editor':                  'community',
  'gomtu':                        'community',
  'lunar strategy':               'community',
  'seed phrase recovery tool':    'community',
  'time travel':                  'community',
  'time travel (extension)':      'community',
  'time travel extension':        'community',
  'magic newton':                 'community',
  'token terminal':               'community',
  'twitter interaction circle':   'community',
  'twitter video downloader':     'community',
  'web3 toolkits by 0xmoei':      'community',
  'brandos':                      'community',

  // ── Analytics ──
  'arkham intelligence':          'analytics',
  'cryptoquant':                  'analytics',
  'debank':                       'analytics',
  'defillama':                    'analytics',
  'dexscreener':                  'analytics',
  'dextools':                     'analytics',
  'dune analytics':               'analytics',
  'flipside crypto':              'analytics',
  'geckoterminal':                'analytics',
  'glassnode':                    'analytics',
  'l2beat':                       'analytics',
  'messari':                      'analytics',
  'nansen':                       'analytics',
  'santiment':                    'analytics',
  'tenderly':                     'analytics',
  'zapper':                       'analytics',

  // ── Bridges ──
  'across':                       'bridges',
  'allbridge':                    'bridges',
  'axelar':                       'bridges',
  'bridgegg':                     'bridges',
  'connext':                      'bridges',
  'debridge':                     'bridges',
  'gas.zip':                      'bridges',
  'hop protocol':                 'bridges',
  'hyperlane':                    'bridges',
  'layerswap':                    'bridges',
  'layerzero':                    'bridges',
  'meson':                        'bridges',
  'orbiter finance':              'bridges',
  'polyhedra network':            'bridges',
  'rapid bridge':                 'bridges',
  'relay':                        'bridges',
  'stargate':                     'bridges',
  'synapse':                      'bridges',
  'threshold network':            'bridges',
  'wormhole':                     'bridges',

  // ── Trading → DEX (DEX protocols, AMMs, DEX aggregators) ──
  '1inch':                        'dex',
  'aerodrome':                    'dex',
  'aster':                        'dex',
  'balancer':                     'dex',
  'biswap':                       'dex',
  'camelot':                      'dex',
  'carbon':                       'dex',
  'cowswap':                      'dex',
  'curve':                        'dex',
  'curve finance':                'dex',
  'jumper':                       'dex',
  'jupiter':                      'dex',
  'kamino finance':               'dex',
  'matcha':                       'dex',
  'mdex':                         'dex',
  'orca':                         'dex',
  'osmosis':                      'dex',
  'pancakeswap':                  'dex',
  'quickswap':                    'dex',
  'raydium':                      'dex',
  'shadswap':                     'dex',
  'shadeswap':                    'dex',
  'slingshot':                    'dex',
  'spookyswap':                   'dex',
  'sushiswap':                    'dex',
  'tensor':                       'dex',
  'thena':                        'dex',
  'trader joe':                   'dex',
  'uniswap':                      'dex',
  'velodrome':                    'dex',
  'vvs finance':                  'dex',
  'yield yak':                    'dex',
  'zerox':                        'dex',
  '0x':                           'dex',

  // ── Trading → Perps (Perpetuals, derivatives, margin trading) ──
  'aevo':                         'perps',
  'drift finance':                'perps',
  'dydx':                         'perps',
  'gmx':                          'perps',
  'hyperliquid':                  'perps',
  'kwenta':                       'perps',
  'level finance':                'perps',
  'lighter':                      'perps',
  'mux protocol':                 'perps',
  'orderly network':              'perps',
  'pendle':                       'perps',
  'perpetual protocol':           'perps',
  'rabbitx':                      'perps',
  'rollbit perps':                'perps',
  'synfutures':                   'perps',
  'vertex':                       'perps',
  'zkx':                          'perps',

  // ── DeFi ──
  'convex finance':               'defi',
  'frax':                         'defi',
  'goldfinch':                    'defi',
  'maple finance':                'defi',
  'radiant capital':              'defi',
  'venus':                        'defi',
  'yearn finance':                'defi',

  // ── Security ──
  'undrained asset recovery from a compromised wallet': 'security',
  'anti drain extension.':        'security',
  'anti drain tool':              'security',
  'antidrain':                    'security',
  'anti drain tool by @zun2025':  'security',
  'blockaid':                     'security',
  'blowfish':                     'security',
  'certik':                       'security',
  'forta':                        'security',
  'goplus security':              'security',
  'hexagate':                     'security',
  'hypernative':                  'security',
  'immunefi':                     'security',
  'openzeppelin':                 'security',
  'peckshield':                   'security',
  'pocket universe':              'security',
  'revoke delegation tool by @zun2025': 'security',
  'revoke.cash':                  'security',
  'scam sniffer':                 'security',
  'sherlock':                     'security',
  'slowmist':                     'security',
  'sol incinerator':              'security',
  'sol wallet cleaner( claim your sol)': 'security',
  'sol wallet cleaner':           'security',
  'claimyoursol':                 'security',
  'wallet guard':                 'security',

  // ── Wallets ──
  'argent':                       'wallets',
  'backpack':                     'wallets',
  'coinbase wallet':              'wallets',
  'keplr':                        'wallets',
  'leap wallet':                  'wallets',
  'ledger live':                  'wallets',
  'metamask':                     'wallets',
  'okx wallet':                   'wallets',
  'petra':                        'wallets',
  'phantom':                      'wallets',
  'rabby wallet':                 'wallets',
  'rainbow':                      'wallets',
  'safe':                         'wallets',
  'solflare':                     'wallets',
  'zerion':                       'wallets',
  'trezor suite':                 'wallets',
  'trust wallet':                 'wallets',
  'zerion wallet':                'wallets',

  // ── Layer 2 ──
  'alchemy':                      'l2',
  'alchioscy':                    'l2',
  'manta network':                'l2',
  'warden protocol':              'community',
  'oasis network':                'l2',

  // ── NFT ──
  'art blocks':                   'nft',
  'foundation':                   'nft',
  'highlight':                    'nft',
  'magic eden':                   'nft',
  'manifold':                     'nft',
  'mint.fun':                     'nft',
  'opensea':                      'nft',
  'rarible':                      'nft',
  'sound.xyz':                    'nft',
  'superrare':                    'nft',
  'zora':                         'nft',

  // ── Gaming ──
  'aurory':                       'gaming',
  'axie infinity':                'gaming',
  'base sport fantasy':           'gaming',
  'big time':                     'gaming',
  'decentraland':                 'gaming',
  'defi kingdoms':                'gaming',
  'gods unchained':               'gaming',
  'guild of guardians':           'gaming',
  'illuvium':                     'gaming',
  'parallel':                     'gaming',
  'pixels':                       'gaming',
  'shrapnel':                     'gaming',
  'sorare':                       'gaming',
  'splinterlands':                'gaming',
  'star atlas':                   'gaming',
  'the sandbox':                  'gaming',

  // ── Privacy ──
  'aleph zero':                   'privacy',
  'aztec':                        'privacy',
  'iron fish':                    'privacy',
  'phala network':                'privacy',
  'railgun':                      'privacy',
  'secret network':               'privacy',
  'zcash':                        'privacy',

  // ── Predictions ──
  'augur':                        'predictions',
  'azuro':                        'predictions',
  'omen':                         'predictions',
  'overtime markets':             'predictions',
  'polkamarkets':                 'predictions',
  'polymarket':                   'predictions',
  'reality.eth':                  'predictions',
  'sx network':                   'predictions',
  'zeitgeist':                    'predictions',
};

const normalize = (v = '') => String(v || '').trim().toLowerCase();

(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI missing in backend/.env');
  }

  console.log(`\n🔧 fixCategories — mode: ${shouldApply ? 'APPLY' : 'DRY RUN'}\n`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const tools = await Tool.find({}, { id: 1, name: 1, category: 1, status: 1 }).lean();
  console.log(`📦 Total tools in DB: ${tools.length}\n`);

  const planned = [];
  const unmatched = [];

  for (const tool of tools) {
    const key = normalize(tool.name);
    const newCategory = CATEGORY_MAP[key];

    if (!newCategory) {
      unmatched.push({ id: tool.id, name: tool.name, currentCategory: tool.category });
      continue;
    }

    if (tool.category !== newCategory) {
      planned.push({
        _id: tool._id,
        id: tool.id,
        name: tool.name,
        oldCategory: tool.category,
        newCategory,
      });
    }
  }

  // Summary by new category
  const byCategory = planned.reduce((acc, p) => {
    acc[p.newCategory] = (acc[p.newCategory] || 0) + 1;
    return acc;
  }, {});

  console.log('📋 Planned category changes:');
  planned.forEach(p => {
    console.log(`  ${p.name}: ${p.oldCategory} → ${p.newCategory}`);
  });

  console.log(`\n📊 Changes by category:`);
  Object.entries(byCategory).sort().forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} change(s)`);
  });

  console.log(`\n⚠️  Unmatched tools (not in CATEGORY_MAP — will NOT be changed):`);
  if (unmatched.length === 0) {
    console.log('  None — all tools matched!');
  } else {
    unmatched.forEach(u => {
      console.log(`  [${u.currentCategory}] ${u.name} (id: ${u.id})`);
    });
  }

  console.log(`\n📝 Summary:`);
  console.log(`  Tools to update: ${planned.length}`);
  console.log(`  Tools already correct / unmatched: ${tools.length - planned.length}`);
  console.log(`  Unmatched (skipped): ${unmatched.length}`);

  if (shouldApply && planned.length > 0) {
    console.log('\n⚙️  Applying changes...');

    const bulkOps = planned.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { category: p.newCategory } },
      },
    }));

    const result = await Tool.bulkWrite(bulkOps);
    console.log(`✅ bulkWrite complete: ${result.modifiedCount} document(s) updated.`);
  } else if (!shouldApply) {
    console.log('\n💡 This was a dry run. Run with --apply to write changes to the DB.');
  } else {
    console.log('\nℹ️  No changes needed.');
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected.');
})().catch(async (err) => {
  console.error('❌ fixCategories failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
