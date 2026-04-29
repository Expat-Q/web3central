/**
 * updateBountyAndCex.js
 * 1. Removes Layer3 and Zealy from bounty hub
 * 2. Adds missing bug bounty platforms to bounty hub (HackenProof, Code4rena, etc.)
 * 3. Adds missing CEX exchanges (MEXC, KuCoin, Gate, Bybit, Crypto.com, Upbit, Bitget, HTX)
 *
 * SAFE: Uses upsert — does NOT wipe anything.
 * Usage: node scripts/updateBountyAndCex.js
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mk = (id, name, category, url, description, tags, twitterHandle) => ({
  id, name, category, url, description, tags,
  builder: { name, handle: `@${twitterHandle}`, twitter: `https://twitter.com/${twitterHandle}` },
  status: 'active',
  verified: true,
  trending: false,
  recentlyAdded: false,
});

// ── Bug Bounty & Audit platforms to ADD to bountyHub ────────────────
const BUG_BOUNTY_PLATFORMS = [
  mk('hackenproof',   'HackenProof',   'bountyHub', 'https://hackenproof.com',     'Leading Web3 bug bounty platform connecting white-hat hackers with crypto projects.',        ['Bug Bounty','Security','Web3'],              'HackenProof'),
  mk('code4rena',     'Code4rena',     'bountyHub', 'https://code4rena.com',        'Competitive audit platform where security researchers compete to find vulnerabilities.',     ['Competitive Audit','Smart Contracts','Security'], 'code4rena'),
  mk('cantina',       'Cantina',       'bountyHub', 'https://cantina.xyz',          'Audit marketplace connecting top security researchers with Web3 protocols.',                 ['Audit Marketplace','Security','Smart Contracts'], 'cantina_co'),
  mk('hats-finance',  'Hats Finance',  'bountyHub', 'https://hats.finance',         'Decentralized bug bounty and audit competition protocol on Ethereum.',                      ['Decentralized','Bug Bounty','Ethereum'],      'HatsFinance'),
  mk('spearbit',      'Spearbit',      'bountyHub', 'https://spearbit.com',         'Distributed network of world-class security experts for protocol audits and reviews.',     ['Audits','Security Research','Expert Network'],'SpearbitDAO'),
  mk('secure3',       'Secure3',       'bountyHub', 'https://secure3.io',           'AI-powered smart contract auditing marketplace and bug bounty platform.',                   ['AI Audit','Bug Bounty','Smart Contracts'],    'Secure3io'),
  mk('zellic',        'Zellic',        'bountyHub', 'https://zellic.io',            'Security research firm offering smart contract audits and vulnerability assessments.',       ['Security Research','Audits','Web3'],          'zellic_io'),
  mk('cyfrin',        'Cyfrin',        'bountyHub', 'https://cyfrin.io',            'Smart contract audit and security education platform for the Web3 ecosystem.',              ['Audits','Education','Competitive'],           'CyfrinAudits'),
];

// ── Missing CEX exchanges ─────────────────────────────────────────────
const MISSING_CEX = [
  mk('mexc',      'MEXC',          'cex', 'https://mexc.com',         'Global crypto exchange offering spot, futures, ETF and staking with 1,700+ tokens.',   ['CEX','Spot','Futures','Wide Selection'],  'MEXC_Official'),
  mk('kucoin',    'KuCoin',        'cex', 'https://kucoin.com',       'Global crypto exchange known as "The People\'s Exchange" with 700+ assets.',            ['CEX','Altcoins','Spot','Futures'],        'kucoincom'),
  mk('gate',      'Gate.io',       'cex', 'https://gate.io',          'Top crypto exchange with 1,400+ listed tokens including many early-stage projects.',    ['CEX','Spot','Futures','Wide Selection'],  'gate_io'),
  mk('bybit',     'Bybit',         'cex', 'https://bybit.com',        'Leading derivatives exchange with deep liquidity for perpetual and inverse contracts.', ['CEX','Derivatives','Perpetuals','Spot'], 'Bybit_Official'),
  mk('crypto-com','Crypto.com',    'cex', 'https://crypto.com',       'Full-suite crypto platform with exchange, Visa card, DeFi wallet and NFT marketplace.',['CEX','Visa Card','App','Staking'],       'Cryptocom'),
  mk('upbit',     'Upbit',         'cex', 'https://upbit.com',        'South Korea\'s largest crypto exchange with high KRW-pair liquidity.',                  ['CEX','Korea','KRW','Spot'],               'upbitglobal'),
  mk('bitget',    'Bitget',        'cex', 'https://bitget.com',       'Fast-growing derivatives and copy-trading exchange with strong community features.',   ['CEX','Copy Trading','Derivatives','Spot'],'Bitget_Global'),
  mk('htx',       'HTX (Huobi)',   'cex', 'https://htx.com',          'Global crypto exchange formerly known as Huobi, offering spot and derivatives trading.',['CEX','Spot','Derivatives','Global'],     'HTX_Global'),
];

// IDs to REMOVE from bounty hub
const REMOVE_IDS = ['layer3', 'crew3'];

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing'); process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── Step 1: Remove Layer3 & Zealy ──────────────────────────────
  console.log('🗑️  Removing Layer3 and Zealy from bounty hub...');
  for (const id of REMOVE_IDS) {
    const result = await Tool.deleteOne({ id });
    console.log(`  ${result.deletedCount > 0 ? '✅ Deleted' : '⚠️  Not found'}: ${id}`);
  }

  // ── Step 2: Add bug bounty platforms ───────────────────────────
  console.log('\n🔐 Adding bug bounty platforms...');
  for (const p of BUG_BOUNTY_PLATFORMS) {
    const existing = await Tool.findOne({ id: p.id });
    if (existing) {
      await Tool.findOneAndUpdate({ id: p.id }, { $set: p });
      console.log(`  ↩️  Updated: ${p.name}`);
    } else {
      await Tool.create(p);
      console.log(`  ✅ Added:   ${p.name}`);
    }
  }

  // ── Step 3: Add missing CEX exchanges ──────────────────────────
  console.log('\n🏦 Adding missing CEX exchanges...');
  for (const p of MISSING_CEX) {
    const existing = await Tool.findOne({ id: p.id });
    if (existing) {
      await Tool.findOneAndUpdate({ id: p.id }, { $set: p });
      console.log(`  ↩️  Updated: ${p.name}`);
    } else {
      await Tool.create(p);
      console.log(`  ✅ Added:   ${p.name}`);
    }
  }

  // ── Final count ────────────────────────────────────────────────
  const total = await Tool.countDocuments();
  const bountyCount = await Tool.countDocuments({ category: 'bountyHub' });
  const cexCount = await Tool.countDocuments({ category: 'cex' });
  console.log('\n─────────────────────────────────────');
  console.log(`📦 Total tools in DB: ${total}`);
  console.log(`🎯 Bounty Hub: ${bountyCount}`);
  console.log(`🏦 CEX:        ${cexCount}`);
  console.log('✅ All done!');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
