require('dotenv').config();
const mongoose = require('mongoose');
const Tool = require('./models/Tool');
const { deriveToolLogo } = require('./utils/toolLogo');

const decorateToolWithLogo = (toolDoc) => {
  const tool = toolDoc?.toObject ? toolDoc.toObject() : toolDoc;
  if (!tool.logoUrl) {
    const derived = deriveToolLogo(tool);
    if (derived.logoUrl) {
      tool.logoUrl = derived.logoUrl;
      tool.logoSource = derived.logoSource;
    }
  }
  return tool;
};

async function testOutput() {
  await mongoose.connect(process.env.MONGODB_URI);
  const toolDoc = await Tool.findOne({ name: /uniswap/i });
  const tool = decorateToolWithLogo(toolDoc);
  
  console.log("Decorated tool keys:", Object.keys(tool));
  console.log("Decorated tool metrics:", tool.metrics);
  await mongoose.disconnect();
}
testOutput().catch(console.error);
