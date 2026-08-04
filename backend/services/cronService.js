const cron = require('node-cron');
const { fetchLlamaData } = require('./llamaService');

const startCronJobs = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('Running background cron: syncing DeFiLlama & CoinGecko data...');
        try {
            const updated = await fetchLlamaData();
            console.log(`Cron sync complete! Updated ${updated} tools.`);
        } catch (error) {
            console.error('Background cron sync failed:', error.message);
        }
    });

    // Run every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('Running background cron: syncing GitHub dev pulse commits...');
        try {
            const { syncGitHubCommits } = require('./githubService');
            const updated = await syncGitHubCommits();
            console.log(`Cron github sync complete! Updated ${updated} tools.`);
        } catch (error) {
            console.error('Background github sync failed:', error.message);
        }
    });

    // Self-ping keep-alive every 10 minutes to prevent Render idle sleep
    cron.schedule('*/10 * * * *', async () => {
        const targetUrl = process.env.RENDER_EXTERNAL_URL || 'https://web3central.onrender.com';
        try {
            const axios = require('axios');
            await axios.get(`${targetUrl}/api/stats/overview`, { timeout: 10000 });
            console.log(`Keep-alive self-ping sent to ${targetUrl}`);
        } catch (err) {
            console.warn('Keep-alive ping error:', err.message);
        }
    });

    console.log('Background cron jobs started (Sync top of every hour, GitHub sync at 3am daily, Keep-alive ping every 10m).');
};

module.exports = { startCronJobs };
