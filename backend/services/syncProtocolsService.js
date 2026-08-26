const Tool = require('../models/Tool');
const appsData = require('../../src/data/appsData');
const { logger } = require('../lib/logger');

async function syncStaticProtocolsToDb() {
  try {
    logger.info('Starting static protocols DB synchronization...');
    let updatedCount = 0;
    let createdCount = 0;

    // 1. Move Coin Study to analytics
    await Tool.updateOne(
      { id: 'coinstudy' },
      { $set: { category: 'analytics', name: 'Coin Study', url: 'https://coinstudy.xyz', status: 'active', verified: true } },
      { upsert: true }
    );

    // 2. Database Audit & Cleanup Fixes
    await Tool.updateOne(
      { id: 'galxe', category: 'infofi' },
      { $set: { category: 'dao' } }
    );

    // Delete deprecated category items (vibeCoding, onchainAutonomy) and specific duplicates
    await Tool.deleteMany({
      $or: [
        { name: { $in: ['Elsa', 'Warden Protocol', 'Magic Newton', 'Sentient AGI Quiz App', 'Warden protocol WM Counter', 'Lanca Quiz by @adedir', 'Warden Protocol Quiz App'] } },
        { category: { $in: ['onchainAutonomy', 'onchain-autonomy', 'vibecoding', 'vibe-coding', 'vibeCoding'] } },
        { _id: { $in: ['69f19b72c1682afa8607913f', '69f19b77c1682afa86079170', '69f19b78c1682afa86079175', '69f19b70c1682afa86079127'] } }
      ]
    });

    // Fix singular category 'bridge' -> 'bridges'
    await Tool.updateMany({ category: 'bridge' }, { $set: { category: 'bridges' } });

    // Migrate legacy 'community' category protocols -> 'dao'
    await Tool.updateMany({ category: 'community' }, { $set: { category: 'dao' } });

    // Fix Seneca missing URL
    await Tool.updateOne({ id: 'seneca' }, { $set: { url: 'https://seneca.finance', status: 'active' } });

    // 3. Ensure Rally, Airaa HQ, and Stitch3 are in infofi
    const infofiTools = [
      {
        id: 'rally',
        name: 'Rally',
        url: 'http://app.rally.fun',
        description: 'The Future of Decentralized Marketing. Powered by @GenLayer',
        category: 'infofi',
        tags: ['Marketing', 'InfoFi'],
        builder: { name: 'Rally Team', handle: '@RallyOnChain', twitter: 'https://x.com/RallyOnChain' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      },
      {
        id: 'airaa-hq',
        name: 'Airaa HQ 🌸',
        url: 'https://airaa.xyz/campaigns/bounties',
        description: 'A unified distribution platform for brands to go viral.',
        category: 'infofi',
        tags: ['Distribution', 'Bounties', 'InfoFi'],
        builder: { name: 'Airaa Team', handle: '@AiraaAgent', twitter: 'https://x.com/AiraaAgent' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      },
      {
        id: 'stitch3',
        name: 'Stitch3',
        url: 'https://stitch3.ai',
        description: 'We map creator ecosystems. Connecting real projects with real creators. Built on bittensor by @Bitcast_Network',
        category: 'infofi',
        tags: ['Creator Mapping', 'Bittensor', 'InfoFi'],
        builder: { name: 'Stitch3 Team', handle: '@Stitch3_ai', twitter: 'https://x.com/Stitch3_ai' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      }
    ];

    for (const toolData of infofiTools) {
      await Tool.updateOne(
        { id: toolData.id },
        { $set: toolData },
        { upsert: true }
      );
    }

    // 4. Ensure Jumper is in bridges
    await Tool.updateOne(
      { id: 'jumper' },
      {
        $set: {
          id: 'jumper',
          name: 'Jumper',
          url: 'https://jumper.xyz',
          description: 'Get your money moving.',
          category: 'bridges',
          llamaSlug: 'jumper-(li.fi-powered)',
          tags: ['Bridge', 'Interoperability', 'Cross-Chain'],
          builder: { name: 'Jumper Exchange', handle: '@jumperapp', twitter: 'https://x.com/jumperapp' },
          status: 'active',
          verified: true,
          trending: true,
          recentlyAdded: true
        }
      },
      { upsert: true }
    );

    // 5. Ensure Builder Spotlight features zac.eth (@zacxbt)
    const Spotlight = require('../models/Spotlight');
    const zacSpotlight = {
      name: 'zac.eth',
      role: '#1 Trencher on Ethos & Creator of PureAlpha',
      description: 'Discovering crypto projects before the crowd by ranking who 600+ hand-picked elite Web3 wallets follow.',
      story: 'Zac (@zacxbt) is a renowned Web3 alpha researcher and top trencher on Ethos. He created PureAlpha to give everyday builders and traders an unfair advantage by tracking, analyzing, and ranking the real-time Twitter and onchain followings of 600+ hand-picked legendary crypto wallets.',
      twitter: 'https://x.com/zacxbt',
      xProfileImageUrl: 'https://unavatar.io/twitter/zacxbt',
      featuredTools: [
        { initial: 'PA', name: 'PureAlpha', description: 'Rank who 600+ hand-picked wallets follow' },
        { initial: 'MG', name: 'MintGo', description: 'Smart contract minting engine & anti-drain protection' }
      ]
    };
    await Spotlight.updateOne(
      {},
      {
        $set: {
          title: 'Community Builder Spotlight',
          description: 'Highlighting elite Web3 builders and creators.',
          builderSpotlight: zacSpotlight,
          builderSpotlights: [zacSpotlight]
        }
      },
      { upsert: true }
    );

    // 6. Force upsert new protocols MintGo, Waypoint, and PureAlpha
    const newProtocols = [
      {
        id: 'mintgo',
        name: 'MintGo',
        url: 'https://mintgo.fun/',
        description: 'Recognizes contract entry points to overcome mint quantity restrictions while prioritizing fund safety by protecting users from malicious contracts.',
        category: 'communityTools',
        tags: ['Minting Engine', 'Contract Safety', 'Onchain Tools'],
        builder: { name: 'Seawin', handle: '@Seawin_eth', twitter: 'https://x.com/Seawin_eth' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      },
      {
        id: 'waypoint',
        name: 'Waypoint',
        url: 'https://waypoint.tools/',
        description: 'Discover NFTs early.',
        category: 'communityTools',
        tags: ['NFT Discovery', 'Early Alpha', 'Onchain Tools'],
        builder: { name: 'Web3Central', handle: '@_web3central', twitter: 'https://x.com/_web3central' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      },
      {
        id: 'purealpha',
        name: 'PureAlpha',
        url: 'https://purealpha.app/',
        description: 'Find crypto projects before the crowd. Ranks who 600+ hand-picked wallets follow, curated by zac.eth (#1 trencher on ethos).',
        category: 'analytics',
        tags: ['Alpha Tracker', 'Wallet Analytics', 'InfoFi'],
        builder: { name: 'zac.eth', handle: '@zacxbt', twitter: 'https://x.com/zacxbt' },
        status: 'active',
        verified: true,
        trending: true,
        recentlyAdded: true
      },
      {
        id: 'snapshot',
        name: 'Snapshot',
        url: 'https://snapshot.org',
        description: 'Off-chain gasless voting platform for Web3 DAOs and communities.',
        category: 'dao',
        tags: ['DAO', 'Voting', 'Governance', 'Gasless'],
        builder: { name: 'Snapshot Labs', twitter: 'https://twitter.com/SnapshotLabs' },
        status: 'active',
        verified: true,
        trending: true
      },
      {
        id: 'tally',
        name: 'Tally',
        url: 'https://tally.xyz',
        description: 'On-chain DAO governance platform for creating, voting on, and executing proposals.',
        category: 'dao',
        tags: ['DAO', 'Onchain Governance', 'Proposals'],
        builder: { name: 'Tally Team', twitter: 'https://twitter.com/tallyxyz' },
        status: 'active',
        verified: true,
        trending: true
      },
      {
        id: 'safe-global',
        name: 'Safe (Gnosis Safe)',
        url: 'https://safe.global',
        description: 'Decentralized multi-signature asset management vault for DAOs and teams.',
        category: 'dao',
        tags: ['Multi-sig', 'Treasury', 'Security'],
        builder: { name: 'Safe', twitter: 'https://twitter.com/safe' },
        status: 'active',
        verified: true,
        trending: true
      },
      {
        id: 'aragon',
        name: 'Aragon',
        url: 'https://aragon.org',
        description: 'Modular platform to build, manage, and scale decentralized autonomous organizations.',
        category: 'dao',
        tags: ['DAO Builder', 'Governance', 'Treasury'],
        builder: { name: 'Aragon Project', twitter: 'https://twitter.com/AragonProject' },
        status: 'active',
        verified: true
      },
      {
        id: 'gitcoin',
        name: 'Gitcoin',
        url: 'https://gitcoin.co',
        description: 'Community-driven quadratic funding and public goods grant platform for Web3.',
        category: 'dao',
        tags: ['Grants', 'Public Goods', 'Quadratic Funding'],
        builder: { name: 'Gitcoin DAO', twitter: 'https://twitter.com/gitcoin' },
        status: 'active',
        verified: true
      }
    ];

    for (const toolData of newProtocols) {
      await Tool.updateOne(
        { id: toolData.id },
        { $set: toolData },
        { upsert: true }
      );
    }

    // 7. Sync all other categories from appsData.js
    for (const [catKey, tools] of Object.entries(appsData)) {
      if (!Array.isArray(tools)) continue;
      for (const item of tools) {
        if (!item.id || !item.name) continue;
        const res = await Tool.updateOne(
          { id: item.id },
          {
            $setOnInsert: {
              id: item.id,
              name: item.name,
              url: item.url || '',
              description: item.description || '',
              category: item.category || catKey,
              status: item.status || 'active',
              verified: item.verified ?? true,
              tags: item.tags || [],
              builder: item.builder || {}
            }
          },
          { upsert: true }
        );
        if (res.upsertedCount > 0) createdCount++;
        else if (res.modifiedCount > 0) updatedCount++;
      }
    }

    logger.info(`Static protocols sync complete. Created: ${createdCount}, Updated: ${updatedCount}`);
  } catch (err) {
    logger.error('Failed to sync static protocols to DB', { error: err.message });
  }
}

module.exports = { syncStaticProtocolsToDb };
