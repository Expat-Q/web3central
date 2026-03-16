require('dotenv').config();
const mongoose = require('mongoose');
const Tool = require('./models/Tool');

const updates = [
  { id: 'wizz', url: 'https://wizzhq.xyz' },
  { id: 'first-dollar', url: 'https://earnfirstdollar.com' },
  { id: 'scribble', url: 'https://scribble.network' },
  { id: 'gib-work', url: 'https://gib.work' },
  { id: 'superteam-earn', url: 'https://earn.superteam.fun' },
  { id: 'onboard3', url: 'https://onboard3.app' },
  { id: 'tunnl', url: 'https://tunnl.io' },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    let count = 0;
    for (const update of updates) {
      const tool = await Tool.findOneAndUpdate(
        { id: update.id },
        { url: update.url },
        { new: true }
      );
      if (tool) {
        console.log(`Updated ${tool.name} URL to ${tool.url}`);
        count++;
      } else {
        console.log(`Tool ${update.id} not found.`);
      }
    }
    
    console.log(`Done. Updated ${count} tools.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating tools:', error);
    process.exit(1);
  }
}

run();
