require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Sample tool with chains
  const sample = await Tool.findOne({ 'metrics.chains.0': { $exists: true } })
    .select('name chain metrics.chains category')
    .lean();
  console.log('Sample tool with metrics.chains:', JSON.stringify(sample, null, 2));

  // Count tools with top-level `chain` field
  const chainCount = await Tool.countDocuments({ chain: { $exists: true, $ne: '' } });
  console.log('\nTools with top-level chain field:', chainCount);

  // Count tools with metrics.chains array
  const metricsChainsCount = await Tool.countDocuments({ 'metrics.chains.0': { $exists: true } });
  console.log('Tools with metrics.chains:', metricsChainsCount);

  // Distinct chains from metrics.chains
  const distinctChains = await Tool.distinct('metrics.chains');
  console.log('\nDistinct chains in metrics.chains:', distinctChains);

  // Check if any tools have top-level chain
  const sampleTopChain = await Tool.findOne({ chain: { $exists: true, $ne: '' } })
    .select('name chain category')
    .lean();
  console.log('\nSample tool with top-level chain:', sampleTopChain);

  // Count web3Chat category tools
  const web3chatCount = await Tool.countDocuments({ category: 'web3Chat' });
  console.log('\nTools with category=web3Chat:', web3chatCount);

  // Check airdrops
  const airdropCount = await Tool.countDocuments({ category: 'airdrops' });
  const hasAirdropCount = await Tool.countDocuments({ hasAirdrop: true });
  console.log('Tools with category=airdrops:', airdropCount);
  console.log('Tools with hasAirdrop=true:', hasAirdropCount);

  mongoose.disconnect();
});
