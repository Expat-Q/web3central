const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for applyUpdates');

        // Update Jumper
        const jumper = await Tool.findOne({ name: /jumper/i });
        if (jumper) {
            jumper.builder = {
                ...jumper.builder,
                handle: '@jumperapp',
                twitter: 'https://twitter.com/jumperapp'
            };
            await jumper.save();
            console.log('Updated Jumper twitter handle.');
        }

        // Delete Tenderly
        const tenderlyRes = await Tool.deleteMany({ name: /tenderly/i });
        console.log(`Deleted ${tenderlyRes.deletedCount} Tenderly entries.`);

        // Delete Layer 2 and Staking
        const l2Res = await Tool.deleteMany({ category: 'l2' });
        console.log(`Deleted ${l2Res.deletedCount} L2 entries.`);
        
        const stakingRes = await Tool.deleteMany({ category: 'staking' });
        console.log(`Deleted ${stakingRes.deletedCount} Staking entries.`);

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
