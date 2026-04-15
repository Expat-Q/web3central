require('dotenv').config();
const mongoose = require('mongoose');
const Tool = require('./models/Tool');

async function checkApp() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const jumper = await Tool.findOne({ name: /jumper/i });
  console.log("Jumper DB entry:", JSON.stringify(jumper, null, 2));

  if (jumper) {
    jumper.category = 'bridges';
    await jumper.save();
    console.log("Updated Jumper category to 'bridges'");
  }

  const sampleTool = await Tool.findOne({ 'metrics.tvl': { $exists: true } });
  console.log("Sample tool with metrics:", JSON.stringify(sampleTool, null, 2));

  // also lets try to find any tool that has metrics but missing onChainMetrics ?
  const anyTool = await Tool.findOne();
  console.log("Any tool keys:", Object.keys(anyTool.toObject()));
  console.log("Any tool metrics:", JSON.stringify(anyTool.metrics, null, 2));

  mongoose.disconnect();
}

checkApp().catch(console.error);
