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

        // Clear existing data
        await Tool.deleteMany({});
        await Spotlight.deleteMany({});
        console.log('Data cleared...');

        // --- Load Tools Data ---
        // Note: appsData.js now uses module.exports
        const appsDataModule = require('../../src/data/appsData.js');
        const appsData = appsDataModule; // It exports the object directly

        // Flatten the category-based structure into an array of tools
        // but we want to preserve category info if it's not in the object itself.
        // However, in our file structure, each tool object has a 'category' field.
        let tools = [];

        // AppsData is keyed by category, but also contains metadata like "tooltipExplanations"
        // We need to iterate over the keys that are arrays (categories)
        Object.keys(appsData).forEach(key => {
            if (Array.isArray(appsData[key])) {
                // This is a category array
                const categoryTools = appsData[key].map(tool => ({
                    ...tool,
                    category: key // Ensure category is set
                }));
                tools = [...tools, ...categoryTools];
            }
        });

        // Deduplicate tools by ID
        const uniqueTools = Array.from(new Map(tools.map(item => [item.id, item])).values());
        tools = uniqueTools;

        if (tools.length > 0) {
            await Tool.insertMany(tools);
            console.log(`Imported ${tools.length} tools...`);
        } else {
            console.log('No tools found to import.');
        }

        // --- Load Spotlight Data ---
        const spotlightPath = path.join(__dirname, '../data/communitySpotlight.json');
        const spotlightData = JSON.parse(fs.readFileSync(spotlightPath, 'utf-8'));

        await Spotlight.create(spotlightData);
        console.log('Imported Community Spotlight data...');

        console.log('Data Import Success!');
        process.exit();
    } catch (err) {
        console.error('Error with data import:', JSON.stringify(err, null, 2));
        process.exit(1);
    }
};

importData();
