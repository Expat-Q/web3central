const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const newAnalytics = [
    { id: 'dune', name: 'Dune Analytics', handle: '@DuneAnalytics', url: 'https://dune.com' },
    { id: 'frontrunpro', name: 'Frontrunpro', handle: '@frontrunpro', url: 'https://frontrun.pro' },
    { id: 'coinglass', name: 'Coinglass', handle: '@coinglass_com', url: 'https://coinglass.com' },
    { id: 'rootdata', name: 'RootData', handle: '@RootDataCrypto', url: 'https://rootdata.com' },
    { id: 'dropstab', name: 'Dropstab', handle: '@Dropstab_com', url: 'https://dropstab.com' },
    { id: 'metasleuth', name: 'MetaSleuth', handle: '@MetaSleuth', url: 'https://metasleuth.io' },
    { id: 'defillama', name: 'DefiLlama', handle: '@DefiLlama', url: 'https://defillama.com' },
    { id: 'arkham', name: 'Arkham', handle: '@arkham', url: 'https://arkhamintelligence.com' },
    { id: 'bubblemaps', name: 'Bubblemaps', handle: '@bubblemaps', url: 'https://bubblemaps.io' },
    { id: 'dexscreener', name: 'Dexscreener', handle: '@dexscreener', url: 'https://dexscreener.com' },
    { id: 'surfai', name: 'SurfAI', handle: '@SurfAI', url: 'https://surf.build' },
    { id: 'nansen', name: 'Nansen', handle: '@nansen_ai', url: 'https://nansen.ai' },
    { id: 'coinmarketcap', name: 'CoinMarketCap', handle: '@CoinMarketCap', url: 'https://coinmarketcap.com' },
    { id: 'onchaincharts', name: 'Onchaincharts', handle: '@onchaincharts', url: 'https://onchaincharts.com' },
    { id: 'cryptorank', name: 'CryptoRank', handle: '@CryptoRank_io', url: 'https://cryptorank.io' }
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for seedAnalytics');

        for (const app of newAnalytics) {
            const exists = await Tool.findOne({ 
                $or: [
                    { id: app.id },
                    { name: new RegExp('^' + app.name.replace(' Analytics', '') + '?', 'i') }
                ]
            });
            if (!exists) {
                await Tool.create({
                    id: app.id,
                    name: app.name,
                    category: 'analytics',
                    description: `Popular analytics and data platform for Web3: ${app.name}.`,
                    url: app.url,
                    builder: {
                        name: app.name,
                        handle: app.handle,
                        twitter: `https://twitter.com/${app.handle.replace('@', '')}`
                    },
                    status: 'active',
                    verified: true
                });
                console.log(`Added ${app.name}`);
            } else {
                console.log(`Skipped ${app.name} (already exists under ${exists.name})`);
            }
        }

        console.log('Done mapping analytics tools.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
