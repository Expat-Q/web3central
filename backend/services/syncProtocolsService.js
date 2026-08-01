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

    // 2. Remove Galxe Starboard from infofi & delete deprecated categories
    await Tool.updateOne(
      { id: 'galxe', category: 'infofi' },
      { $set: { category: 'community' } }
    );
    await Tool.deleteMany({ category: { $in: ['onchainAutonomy', 'onchain-autonomy', 'vibecoding', 'vibe-coding'] } });

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

    // 4. Sync all other categories from appsData.js
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
