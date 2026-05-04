const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');
const Spotlight = require('../models/Spotlight');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear spotlight only (usually replaced completely)
        await Spotlight.deleteMany({});
        console.log('Spotlight cleared...');

        // --- Load Tools Data ---
        const appsDataModule = require('../../src/data/appsData.js');
        const appsData = appsDataModule; 

        let tools = [];

        Object.keys(appsData).forEach(key => {
            if (Array.isArray(appsData[key])) {
                const categoryTools = appsData[key].map(tool => ({
                    ...tool,
                    category: key 
                }));
                tools = [...tools, ...categoryTools];
            }
        });

        // Deduplicate tools by ID
        const uniqueTools = Array.from(new Map(tools.map(item => [item.id, item])).values());
        
        // --- Filtering Logic ---
        // Only include dapps that are 'active' and have a basic level of quality/usage info
        const filteredTools = uniqueTools.filter(t => {
            // High quality filter: Must have a name, description, and builder info
            const hasBasicInfo = t.name && t.description && t.builder?.name;
            // Usage filter: In appsData, we check if they are marked as active or verified
            const isHighQuality = t.status === 'active' || t.verified === true;
            return hasBasicInfo && isHighQuality;
        });

        console.log(`Found ${filteredTools.length} high-quality tools to upsert...`);

        if (filteredTools.length > 0) {
            let upsertedCount = 0;
            for (const tool of filteredTools) {
                // Use findOneAndUpdate with upsert: true to avoid wiping existing data (like clickCount)
                await Tool.findOneAndUpdate(
                    { id: tool.id },
                    { $set: tool },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                upsertedCount++;
            }
            console.log(`Successfully upserted ${upsertedCount} tools.`);
        } else {
            console.log('No tools found to import.');
        }

        // --- Load Spotlight Data ---
        const spotlightPath = path.join(__dirname, '../data/communitySpotlight.json');
        const spotlightData = JSON.parse(fs.readFileSync(spotlightPath, 'utf-8'));

        await Spotlight.create(spotlightData);
        console.log('Imported Community Spotlight data...');

        console.log('Data Synchronization Success!');
        process.exit();
    } catch (err) {
        console.error('Error with data import:', JSON.stringify(err, null, 2));
        process.exit(1);
    }
};

importData();
