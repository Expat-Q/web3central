/**
 * refineData.js
 * 
 * Refines tool categorization, removes duplication, and adds 8 new bounty platforms.
 * 
 * Usage: node scripts/refineData.js
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in backend/.env');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Move Tools to Correct Categories
    console.log('📦 Moving tools...');
    await Tool.updateOne({ id: 'sol-wallet-cleaner-claim-your-sol' }, { $set: { category: 'community' } });
    await Tool.updateOne({ id: 'sol-incinerator' }, { $set: { category: 'community' } });
    await Tool.updateOne({ id: 'token-terminal' }, { $set: { category: 'analytics' } });

    // 2. Cleanup Duplicates and Legacy
    console.log('🧹 Cleaning up duplicates and legacy...');
    await Tool.deleteOne({ id: 'zerion' }); // Keep zerion-wallet
    await Tool.deleteOne({ id: 'warden' });
    await Tool.deleteOne({ id: 'magicnewton' });
    
    // 3. Remove legacy Onchain Autonomy category tools (already empty, but just in case)
    await Tool.deleteMany({ category: 'onchainAutonomy' });

    // 4. Standardize Bounty Hub tag
    console.log('🏷️  Standardizing Bounty Hub tag (bounty-hub -> bountyHub)...');
    const bountyResult = await Tool.updateMany({ category: 'bounty-hub' }, { $set: { category: 'bountyHub' } });
    console.log(`   Updated ${bountyResult.modifiedCount} bounty hub tools.`);

    // 5. Add 8 New Security Bounty Apps
    console.log('➕ Adding 8 new security bounty apps...');
    const newBountyApps = [
        {
            id: 'immunefi',
            name: 'Immunefi',
            url: 'https://immunefi.com/bug-bounty',
            description: "Biggest Web3 bounty platform. Period. Over $180M paid out to whitehats so far. Notable payouts: $10M Wormhole, $6M Aurora, $2.2M Polygon. Essential for security professionals.",
            category: 'bountyHub',
            builder: { name: 'Immunefi', twitter: 'https://x.com/immunefi' },
            status: 'active',
            verified: true,
            verificationTier: 1
        },
        {
            id: 'hackenproof',
            name: 'HackenProof',
            url: 'https://hackenproof.com/programs',
            description: "An innovative bug bounty platform for crypto projects. 200+ active programs and over $15.7M paid in rewards. Great for developers entering the security space.",
            category: 'bountyHub',
            builder: { name: 'HackenProof', twitter: 'https://x.com/HackenProof' },
            status: 'active',
            verified: true,
            verificationTier: 2
        },
        {
            id: 'sherlock',
            name: 'Sherlock',
            url: 'https://sherlock.xyz/solutions/bug-bounties',
            description: "Every bug submission is reviewed by senior auditors before it reaches the protocol team. Offers high payouts up to $500K USDC for single vulnerabilities.",
            category: 'bountyHub',
            builder: { name: 'Sherlock', twitter: 'https://x.com/sherlockdefi' },
            status: 'active',
            verified: true,
            verificationTier: 2
        },
        {
            id: 'code4rena',
            name: 'Code4rena',
            url: 'https://code4rena.com',
            description: "Competitive audit marketplace where researchers hunt bugs in the same codebase. The best findings get paid the most. Excellent for building a security reputation.",
            category: 'bountyHub',
            builder: { name: 'Code4rena', twitter: 'https://x.com/code4rena' },
            status: 'active',
            verified: true,
            verificationTier: 2
        },
        {
            id: 'hats-finance',
            name: 'Hats Finance',
            url: 'https://hats.finance',
            description: "A fully on-chain bug bounty protocol. Find a bug and get paid directly with no middleman or waiting periods. Transparent and decentralized security.",
            category: 'bountyHub',
            builder: { name: 'Hats Finance', twitter: 'https://x.com/HatsFinance' },
            status: 'active',
            verified: true,
            verificationTier: 2
        },
        {
            id: 'hashlock',
            name: 'Hashlock',
            url: 'https://hashlock.com/bug-bounty',
            description: "Web3 security firm covering Solidity, Rust, and Move. Known for faster triage and payouts compared to most traditional bounty platforms.",
            category: 'bountyHub',
            builder: { name: 'Hashlock', twitter: 'https://x.com/Hashlock_' },
            status: 'active',
            verified: true,
            verificationTier: 3
        },
        {
            id: 'bugcrowd',
            name: 'Bugcrowd',
            url: 'https://bugcrowd.com',
            description: "A leading crowdsourced security platform used by major protocols like Coinbase and MakerDAO. Features programs with over 500,000 security researchers.",
            category: 'bountyHub',
            builder: { name: 'Bugcrowd', twitter: 'https://x.com/Bugcrowd' },
            status: 'active',
            verified: true,
            verificationTier: 1
        },
        {
            id: 'hackerone',
            name: 'HackerOne',
            url: 'https://hackerone.com',
            description: "Globally trusted vulnerability coordination and bug bounty platform. Provides strong triage and fast feedback for serious payouts.",
            category: 'bountyHub',
            builder: { name: 'HackerOne', twitter: 'https://x.com/Hacker0x01' },
            status: 'active',
            verified: true,
            verificationTier: 1
        }
    ];

    for (const app of newBountyApps) {
        const existing = await Tool.findOne({ id: app.id });
        if (!existing) {
            await Tool.create(app);
            console.log(`   Added: ${app.name}`);
        } else {
            console.log(`   Skipped (already exists): ${app.name}`);
        }
    }

    console.log('\n✨ Refinement complete!');
    await mongoose.disconnect();
})().catch(async (err) => {
    console.error('❌ refineData failed:', err.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
});
