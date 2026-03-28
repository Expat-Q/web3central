const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TARGET_NAMES = [
  /sol\s*wallet\s*cleaner/i,
  /twitter\s*video\s*downloader/i,
];

const isTargetName = (name = '') => TARGET_NAMES.some((rx) => rx.test(name));

(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const preview = await Tool.find(
    {
      $or: [
        { id: 'test-tool' },
        { name: { $regex: 'test tool', $options: 'i' } },
        { name: { $regex: 'sol\\s*wallet\\s*cleaner', $options: 'i' } },
        { name: { $regex: 'twitter\\s*video\\s*downloader', $options: 'i' } },
      ]
    },
    { id: 1, name: 1, category: 1 }
  ).lean();

  console.log('Matched tools before update:');
  console.log(JSON.stringify(preview, null, 2));

  const deleteResult = await Tool.deleteMany({
    $or: [
      { id: 'test-tool' },
      { name: { $regex: '^test tool$', $options: 'i' } },
      { id: { $regex: 'test-tool|test', $options: 'i' } },
      { name: { $regex: 'test tool', $options: 'i' } },
    ]
  });

  const moveResult = await Tool.updateMany(
    {
      $or: [
        { id: { $in: ['sol-wallet-cleaner', 'twitter-video-downloader'] } },
        { name: { $regex: 'sol\\s*wallet\\s*cleaner', $options: 'i' } },
        { name: { $regex: 'twitter\\s*video\\s*downloader', $options: 'i' } },
      ]
    },
    { $set: { category: 'communityTools' } }
  );

  const post = await Tool.find(
    {
      $or: [
        { id: { $in: ['sol-wallet-cleaner', 'twitter-video-downloader'] } },
        { name: { $regex: 'sol\\s*wallet\\s*cleaner', $options: 'i' } },
        { name: { $regex: 'twitter\\s*video\\s*downloader', $options: 'i' } },
      ]
    },
    { id: 1, name: 1, category: 1 }
  ).lean();

  console.log(`Deleted test-tool docs: ${deleteResult.deletedCount}`);
  console.log(`Recategorized docs: ${moveResult.modifiedCount}`);
  console.log('Post-update target tools:');
  console.log(JSON.stringify(post, null, 2));

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('prodCleanup failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
