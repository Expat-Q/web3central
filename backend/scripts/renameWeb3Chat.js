require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Tool = require('../models/Tool');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Rename web3Chat -> perps in the database
  const result = await Tool.updateMany(
    { category: 'web3Chat' },
    { $set: { category: 'perps' } }
  );
  console.log(`Renamed ${result.modifiedCount} tools from web3Chat -> perps`);
  
  // Verify
  const remaining = await Tool.countDocuments({ category: 'web3Chat' });
  const perpsCount = await Tool.countDocuments({ category: 'perps' });
  console.log(`Remaining web3Chat: ${remaining}`);
  console.log(`Total perps: ${perpsCount}`);
  
  mongoose.disconnect();
});
