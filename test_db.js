const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Tool = require('./backend/models/Tool');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    const count = await Tool.countDocuments({});
    console.log(`Tool count: ${count}`);
    
    const firstTool = await Tool.findOne({});
    console.log(`First tool: ${firstTool?.name}`);
    console.log(`Metrics:`, firstTool?.metrics);

    await mongoose.connection.close();
    console.log('Closed.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
