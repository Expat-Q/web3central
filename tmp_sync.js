const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { fetchLlamaData } = require('./backend/services/llamaService');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function runSync() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Triggering DeFiLlama Sync...');
    const startTime = Date.now();
    const count = await fetchLlamaData();
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`Sync complete. Updated ${count} tools in ${duration}s.`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Sync failed with fatal error:');
    console.error(err);
    process.exit(1);
  }
}

runSync();
