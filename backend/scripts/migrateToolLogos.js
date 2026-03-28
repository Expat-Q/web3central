const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Tool = require('../models/Tool');
const { deriveToolLogo } = require('../utils/toolLogo');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateToolLogos() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const tools = await Tool.find({});
  let updated = 0;

  for (const tool of tools) {
    const { logoUrl, logoSource } = deriveToolLogo(tool);
    if (!logoUrl) continue;

    const hasChange = tool.logoUrl !== logoUrl || tool.logoSource !== logoSource;
    if (!hasChange) continue;

    tool.logoUrl = logoUrl;
    tool.logoSource = logoSource;
    await tool.save();
    updated += 1;
  }

  console.log(`Tool logo migration complete. Updated: ${updated}/${tools.length}`);
  await mongoose.disconnect();
}

migrateToolLogos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Tool logo migration failed:', err);
    process.exit(1);
  });
