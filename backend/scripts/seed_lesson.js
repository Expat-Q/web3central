require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

    await Lesson.deleteMany({ isUserGenerated: { $ne: true } });

    await Lesson.create({
        id: 'intro-to-web3',
        slug: 'intro-to-web3',
        module: 'Web3 Foundations',
        title: 'What is Web3? The Shift From Trusting Institutions to Trusting Code',
        description: 'Understand the structural transformation happening in global finance and data ownership — from centralised gatekeepers to cryptographic guarantees.',
        level: 'Beginner',
        xpReward: 100,
        isUserGenerated: false,
        contentMarkdown: `
## The Old Internet Was Built on Trust

When you use a bank, you trust it to hold your money. When you log in to Google, you trust them with your data. When you send a wire transfer, you trust SWIFT to route it correctly. This is **institutions-as-intermediaries** — and it has worked reasonably well for decades.

But it comes with hard trade-offs:

- **Censorship** — any institution can freeze your account or block access
- **Opacity** — you cannot verify what happens to your data or assets
- **Counterparty risk** — the institution can fail, be hacked, or act against your interests
- **Geographic barriers** — billions remain unbanked due to institutional friction

---

## Web3's Core Insight

Web3 does not just move services to the internet. It replaces **trust in institutions** with **trust in mathematics**.

> "Don't trust — verify."

A smart contract on Ethereum will execute exactly as written, every time, for every person on earth, without needing to know who you are or where you live. It cannot be pressured, bribed, or shut down.

---

## The Three Pillars

**1. Self-Sovereignty**
Your private key *is* your identity. No username, no password reset, no "we locked your account." You own your assets the same way you own cash in your wallet.

**2. On-Chain Logic**
Business rules live in smart contracts — immutable code deployed to a decentralised network. Anyone can read the rules. Anyone can verify execution.

**3. Decentralised Settlement**
Transactions are validated by thousands of independent nodes running the same algorithm. No single point of failure. No single point of control.

---

## Why It Matters Right Now

Traditional finance processes roughly **$1.5 quadrillion** in derivatives annually — yet settlement takes 2–3 business days and involves dozens of intermediaries each clipping a fee.

DeFi protocols settle the equivalent trade in **13 seconds** on Ethereum mainnet, with fees visible to everyone, shared with the protocol's liquidity providers, not with banks.

This is not incremental improvement. It is architectural replacement.

---

## What You Will Learn in This Academy

By the end of this curriculum you will understand:

- How blockchains achieve consensus without a central authority
- How AMMs price assets without order books
- How to audit a smart contract for common vulnerabilities
- How institutional capital is flowing into Web3 infrastructure

Each lesson earns you XP and tracks your progress toward mastery.

**Next:** *How Blockchains Actually Work — Nodes, Consensus, and Finality*
        `.trim()
    });

    console.log('✅ Demo lesson seeded: intro-to-web3');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
