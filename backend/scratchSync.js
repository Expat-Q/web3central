require('dotenv').config();
const mongoose = require('mongoose');
const { fetchLlamaData } = require('./services/llamaService');

async function syncMetrics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  try {
    const count = await fetchLlamaData();
    console.log(`Synced metrics for ${count} tools.`);
  } catch (e) {
    console.error("Sync error:", e);
  }

  mongoose.disconnect();
}

syncMetrics().catch(console.error);
