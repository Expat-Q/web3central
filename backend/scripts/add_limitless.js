const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const addLimitless = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
        
        const predictionMarket = {
            id: "limitless",
            name: "Limitless",
            url: "https://limitless.exchange/markets",
            description: "Predict crypto & stock prices with nonstop hourly and daily markets.",
            category: "predictions",
            tags: ["Prediction Markets", "Crypto", "Stocks"],
            builder: {
                name: "Limitless",
                handle: "@trylimitless",
                twitter: "https://twitter.com/trylimitless"
            },
            status: "active",
            verified: true,
            trending: true,
            recentlyAdded: true,
            monthlyUsers: "New",
            popularWith: ["Traders", "Crypto Enthusiasts"],
            narrative: "Prediction Markets",
            narrativeDescription: "Hourly and daily predictions"
        };
        
        await Tool.findOneAndUpdate({ id: "limitless" }, predictionMarket, { upsert: true, new: true });
        console.log('Limitless added/updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

addLimitless();
