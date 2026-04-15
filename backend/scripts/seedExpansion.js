/**
 * seedExpansion.js
 * Synchronizes the database with new high-signal protocols.
 * Also uplifts the ban on Onboard3.
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PROTOCOLS = [
  // --- RWA ---
  {
    id: "ondo-finance", name: "Ondo Finance", category: "rwa",
    url: "https://ondo.finance", logo: "https://logo.clearbit.com/ondo.finance",
    description: "Institutional-grade DeFi products bridging traditional finance and decentralized markets.",
    tags: ["Treasuries", "Yield", "Institutional"],
    builder: { name: "Ondo Team", twitter: "https://twitter.com/OndoFinance" }
  },
  {
    id: "securitize", name: "Securitize", category: "rwa",
    url: "https://securitize.io", logo: "https://logo.clearbit.com/securitize.io",
    description: "End-to-end platform for tokenizing real-world assets like private equity and real estate.",
    tags: ["Tokenization", "Compliance", "Assets"],
    builder: { name: "Securitize", twitter: "https://twitter.com/Securitize" }
  },
  {
    id: "centrifuge", name: "Centrifuge", category: "rwa",
    url: "https://centrifuge.io", logo: "https://logo.clearbit.com/centrifuge.io",
    description: "Institutional-grade decentralized protocol for tokenizing real-world assets into DeFi.",
    tags: ["Credit", "Tokenization", "Pools"],
    builder: { name: "Centrifuge", twitter: "https://twitter.com/centrifuge" }
  },
  {
    id: "superstate", name: "Superstate", category: "rwa",
    url: "https://superstate.co", logo: "https://logo.clearbit.com/superstate.co",
    description: "Blockchain-native investment products for the modern financial system.",
    tags: ["Funds", "Treasuries", "Governance"],
    builder: { name: "Superstate", twitter: "https://twitter.com/superstate" }
  },
  {
    id: "openeden", name: "OpenEden", category: "rwa",
    url: "https://openeden.com", logo: "https://logo.clearbit.com/openeden.com",
    description: "Compliant on-chain treasury management through tokenized U.S. T-Bills.",
    tags: ["T-Bills", "Treasury", "Yield"],
    builder: { name: "OpenEden", twitter: "https://twitter.com/OpenEden" }
  },
  {
    id: "backed", name: "Backed", category: "rwa",
    url: "https://backed.fi", logo: "https://logo.clearbit.com/backed.fi",
    description: "Fully backed ERC-20 tokens tracking the value of stocks and ETFs.",
    tags: ["Stocks", "ETFs", "Tokenized"],
    builder: { name: "Backed", twitter: "https://twitter.com/backedfi" }
  },
  {
    id: "landshare", name: "Landshare", category: "rwa",
    url: "https://landshare.io", logo: "https://logo.clearbit.com/landshare.io",
    description: "Tokenized real estate platform bringing fractional property ownership to the blockchain.",
    tags: ["Real Estate", "Fractional", "Yield"],
    builder: { name: "Landshare", twitter: "https://twitter.com/LandshareIO" }
  },
  {
    id: "mountain-protocol", name: "Mountain Protocol", category: "rwa",
    url: "https://mountainprotocol.com", logo: "https://logo.clearbit.com/mountainprotocol.com",
    description: "Issuer of USDM, a yield-bearing stablecoin fully backed by U.S. Treasuries.",
    tags: ["Stablecoin", "Yield-bearing", "Treasuries"],
    builder: { name: "Mountain Protocol", twitter: "https://twitter.com/MountainUSDM" }
  },
  {
    id: "goldfinch", name: "Goldfinch", category: "rwa",
    url: "https://goldfinch.finance", logo: "https://logo.clearbit.com/goldfinch.finance",
    description: "Decentralized credit protocol for emerging markets without crypto collateral.",
    tags: ["Credit", "Uncollateralized", "Emerging Markets"],
    builder: { name: "Goldfinch", twitter: "https://twitter.com/goldfinch_fi" }
  },
  {
    id: "maple-finance", name: "Maple Finance", category: "rwa",
    url: "https://maple.finance", logo: "https://logo.clearbit.com/maple.finance",
    description: "Institutional credit marketplace for undercollateralized lending.",
    tags: ["Institutional", "Lending", "Credit"],
    builder: { name: "Maple Finance", twitter: "https://twitter.com/maplefinance" }
  },

  // --- DeFi ---
  {
    id: "aave", name: "Aave", category: "defi",
    url: "https://aave.com", logo: "https://logo.clearbit.com/aave.com",
    description: "Leading decentralized liquidity protocol for borrowing and lending assets.",
    tags: ["Lending", "Borrowing", "Liquidity"],
    builder: { name: "Aave Labs", twitter: "https://twitter.com/aave" }
  },
  {
    id: "morpho", name: "Morpho", category: "defi",
    url: "https://morpho.org", logo: "https://logo.clearbit.com/morpho.org",
    description: "Peer-to-peer lending optimizer built on top of existing lending pools.",
    tags: ["Optimization", "P2P", "Lending"],
    builder: { name: "Morpho Labs", twitter: "https://twitter.com/MorphoLabs" }
  },
  {
    id: "sky-maker", name: "Sky (Maker)", category: "defi",
    url: "https://sky.money", logo: "https://logo.clearbit.com/sky.money",
    description: "Decentralized protocol behind the DAI and USDS stablecoins.",
    tags: ["Stablecoin", "DAI", "CDP"],
    builder: { name: "Sky Ecosystem", twitter: "https://twitter.com/SkyEcosystem" }
  },
  {
    id: "compound", name: "Compound", category: "defi",
    url: "https://compound.finance", logo: "https://logo.clearbit.com/compound.finance",
    description: "Algorithmic, autonomous interest rate protocol for lending and borrowing.",
    tags: ["Lending", "Interest Rate", "DAO"],
    builder: { name: "Compound Labs", twitter: "https://twitter.com/compoundfinance" }
  },
  {
    id: "ethena", name: "Ethena", category: "defi",
    url: "https://ethena.fi", logo: "https://logo.clearbit.com/ethena.fi",
    description: "Synthetic dollar protocol providing a crypto-native, yield-bearing alternative to fiat.",
    tags: ["Synthetic Dollar", "Yield", "Delta-Neutral"],
    builder: { name: "Ethena Labs", twitter: "https://twitter.com/ethena_labs" }
  },
  {
    id: "yearn-finance", name: "Yearn Finance", category: "defi",
    url: "https://yearn.fi", logo: "https://logo.clearbit.com/yearn.fi",
    description: "DeFi yield optimizer that automates the pursuit of the best yield strategies.",
    tags: ["Yield", "Optimizer", "Vaults"],
    builder: { name: "Yearn DAO", twitter: "https://twitter.com/iearnfinance" }
  },
  {
    id: "pendle-finance", name: "Pendle Finance", category: "defi",
    url: "https://pendle.finance", logo: "https://logo.clearbit.com/pendle.finance",
    description: "Yield-trading protocol that allows for the separation of principal and yield.",
    tags: ["Yield Trading", "LSD", "Fixed Income"],
    builder: { name: "Pendle Team", twitter: "https://twitter.com/pendle_fi" }
  },
  {
    id: "moonwell", name: "Moonwell", category: "defi",
    url: "https://moonwell.fi", logo: "https://logo.clearbit.com/moonwell.fi",
    description: "Open lending and borrowing protocol on Base and Moonbeam.",
    tags: ["Lending", "Base", "Moonbeam"],
    builder: { name: "Moonwell Team", twitter: "https://twitter.com/MoonwellDeFi" }
  },

  // --- Gaming ---
  {
    id: "treasure", name: "Treasure", category: "gaming",
    url: "https://treasure.lol", logo: "https://logo.clearbit.com/treasure.lol",
    description: "Decentralized gaming ecosystem on Arbitrum connecting players and metaverses.",
    tags: ["Ecosystem", "Arbitrum", "NFT"],
    builder: { name: "Treasure DAO", twitter: "https://twitter.com/Treasure_DAO" }
  },
  {
    id: "ai-arena", name: "AI Arena", category: "gaming",
    url: "https://aiarena.io", logo: "https://logo.clearbit.com/aiarena.io",
    description: "Competitive gaming platform powered by AI-integrated characters.",
    tags: ["AI", "Competitive", "PvP"],
    builder: { name: "ArenaX Lab", twitter: "https://twitter.com/aiarena_" }
  },

  // --- NFT ---
  {
    id: "element-market", name: "Element Market", category: "nft",
    url: "https://element.market", logo: "https://logo.clearbit.com/element.market",
    description: "Multi-chain NFT marketplace aggregator with community-driven rewards.",
    tags: ["Marketplace", "Aggregator", "Multi-chain"],
    builder: { name: "Element Team", twitter: "https://twitter.com/Element_Market" }
  },

  // --- Analytics & Security ---
  {
    id: "3dns", name: "3DNS", category: "security",
    url: "https://3dns.box", logo: "https://logo.clearbit.com/3dns.box",
    description: "The first decentralized domain name registrar for Web3 and beyond.",
    tags: ["Domains", "DNS", "Infrastructure"],
    builder: { name: "3DNS Team", twitter: "https://twitter.com/3dns_official" }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let added = 0, updated = 0, skipped = 0;

    // 1. Process new/updated protocols
    for (const proto of PROTOCOLS) {
      const tool = await Tool.findOneAndUpdate(
        { id: proto.id },
        { ...proto, status: 'active', verified: true },
        { upsert: true, new: true }
      );
      if (tool) {
        console.log(`  - Synchronized: ${proto.name} [${proto.category}]`);
        updated++;
      }
    }

    // 2. Uplift Onboard3 ban
    const onboard3 = await Tool.findOneAndUpdate(
        { id: 'onboard3' },
        { status: 'active', isOffline: false },
        { new: true }
    );
    if (onboard3) {
        console.log(`  - ✅ Uplifted ban on Onboard3 [${onboard3.status}]`);
        updated++;
    } else {
        console.log(`  - ⚠️ Onboard3 not found in DB.`);
    }

    console.log(`\n🎉 Sync complete! Total processed: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
