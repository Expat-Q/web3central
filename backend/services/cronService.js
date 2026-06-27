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

    console.log('Background cron jobs started (Sync set for top of every hour, GitHub sync at 3am daily).');
};

module.exports = { startCronJobs };
