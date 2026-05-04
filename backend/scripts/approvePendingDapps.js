const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Tool = require('../models/Tool');

async function approvePendingDapps() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('Finding dapps with status: "pending"...');
        const pendingCount = await Tool.countDocuments({ status: 'pending' });
        
        if (pendingCount === 0) {
            console.log('No pending dapps found.');
            return;
        }

        console.log(`Approving ${pendingCount} dapps...`);
        
        const result = await Tool.updateMany(
            { status: 'pending' },
            { 
                $set: { 
                    status: 'active',
                    verified: true // We verify them as part of the onboarding approval
                } 
            }
        );

        console.log(`Success! ${result.modifiedCount} dapps approved and set to active.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Approval Error:', err.message);
    }
}

approvePendingDapps();
