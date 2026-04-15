const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const addApps = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
        
        const kalshi = {
          id: "kalshi",
          name: "Kalshi",
          url: "https://kalshi.com/x",
          description: "Trade on anything: politics, sports, entertainment, crypto, weather, and so much more. For sports: ",
          category: "predictions",
          tags: ["Prediction Markets", "Real World Events"],
          builder: {
            name: "Kalshi",
            handle: "@Kalshi",
            twitter: "https://twitter.com/Kalshi"
          },
          status: "active",
          verified: true,
          trending: true,
          recentlyAdded: true,
          monthlyUsers: "New",
          popularWith: ["Traders", "Event Forecasters"],
          narrative: "Prediction Markets",
          narrativeDescription: "Real world event predictions"
        };
        
        await Tool.findOneAndUpdate({ id: "kalshi" }, kalshi, { upsert: true, new: true });
        console.log('Kalshi added/updated successfully!');

        const enbBlast = {
          id: "enb-blast",
          name: "enb blast",
          url: "https://blast.enb.fun/",
          description: "play enb blast on base,top the table and win $ENB tokens.",
          category: "gaming",
          tags: ["Gaming", "Base", "Play-to-Earn"],
          builder: {
            name: "EverybNeedsBase",
            handle: "@EverybNeedsBase",
            twitter: "https://twitter.com/EverybNeedsBase"
          },
          status: "active",
          verified: true,
          trending: true,
          recentlyAdded: true,
          monthlyUsers: "New",
          popularWith: ["Gamers", "Base Users"],
          narrative: "Onchain Gaming",
          narrativeDescription: "Play to earn on Base"
        };
        
        await Tool.findOneAndUpdate({ id: "enb-blast" }, enbBlast, { upsert: true, new: true });
        console.log('ENB Blast added/updated successfully!');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

addApps();
