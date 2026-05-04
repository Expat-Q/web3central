const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Tool = require('../models/Tool');

async function importOnboarding() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const pendingPath = path.join(__dirname, '../data/pending_onboarding.json');
        if (!fs.existsSync(pendingPath)) {
            console.error('No pending_onboarding.json found.');
            return;
        }

        const protocols = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
        console.log(`Starting import of ${protocols.length} protocols...`);

        let updated = 0;
        let inserted = 0;

        for (const p of protocols) {
            // Ensure ID is unique and valid
            const toolData = {
                id: p.id,
                name: p.name,
                url: p.url,
                description: p.description,
                category: p.category,
                tags: p.tags,
                logoUrl: p.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${p.name}`,
                builder: p.builder,
                status: p.status,
                verified: p.verified,
                metrics: p.metrics,
                llamaSlug: p.llamaSlug,
                featured: false,
                clickCount: 0
            };

            const result = await Tool.updateOne(
                { 
                    $or: [
                        { name: p.name },
                        { url: p.url }
                    ]
                },
                { $set: toolData },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                inserted++;
            } else {
                updated++;
            }
        }

        console.log('Import Complete!');
        console.log(`- New protocols added: ${inserted}`);
        console.log(`- Existing protocols updated: ${updated}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Import Error:', err.message);
    }
}

importOnboarding();
