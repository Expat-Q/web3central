require('dotenv').config();
const mongoose = require('mongoose');
const Tool = require('./models/Tool');

const bounties = [
    {
        id: 'wizz',
        name: 'Wizz',
        url: 'https://x.com/WizzHQ',
        description: 'Powering new revenue streams for creators and devs through agentic contribution. Pays creators for threads, memes, and articles ($50–$300+).',
        category: 'bountyHub',
        builder: {
            name: 'Wizz',
            twitter: 'https://x.com/WizzHQ'
        },
        status: 'active'
    },
    {
        id: 'stallion',
        name: 'Stallion',
        url: 'https://www.earnstallions.xyz/',
        description: 'Connecting global talents to Stellar opportunities. Earn $20–$300 for short threads or videos.',
        category: 'bountyHub',
        builder: {
            name: 'Stallion',
            twitter: 'https://x.com/stallionsearn'
        },
        status: 'active'
    },
    {
        id: 'first-dollar',
        name: 'First Dollar',
        url: 'https://app.firstdollar.money/',
        description: 'Beginner-friendly platform powered by InnerCircle. Earn $20–$300 for submitted threads or videos.',
        category: 'bountyHub',
        builder: {
            name: 'First Dollar',
            twitter: 'https://x.com/earnfirstdollar'
        },
        status: 'active'
    },
    {
        id: 'scribble',
        name: 'Scribble',
        url: 'https://x.com/scribble_dao',
        description: 'The ultimate earnings platform for creators. Pays $30–$300 for research posts, videos, and threads.',
        category: 'bountyHub',
        builder: {
            name: 'Scribble',
            twitter: 'https://x.com/scribble_dao'
        },
        status: 'active'
    },
    {
        id: 'gib-work',
        name: 'Gib.Work',
        url: 'https://x.com/gib_work',
        description: 'Where anyone can create work, take on work, and get paid in the internet’s currency. Typical payouts: $20–$250.',
        category: 'bountyHub',
        builder: {
            name: 'Gib.Work',
            twitter: 'https://x.com/gib_work'
        },
        status: 'active'
    },
    {
        id: 'superteam-earn',
        name: 'Superteam Earn',
        url: 'https://x.com/SuperteamEarn',
        description: 'Making work2earn cool again. High-paying bounties ($100–$2,500+) and freelance gigs from crypto companies on Solana.',
        category: 'bountyHub',
        builder: {
            name: 'Superteam Earn',
            twitter: 'https://x.com/SuperteamEarn'
        },
        status: 'active'
    },
    {
        id: 'cre8core',
        name: 'Cre8core Labs',
        url: 'https://cre8core.fun',
        description: 'The creative layer of Base. One Platform, Infinite Campaigns, Endless Rewards. Typical payouts: $20–$300+.',
        category: 'bountyHub',
        builder: {
            name: 'Cre8core Labs',
            twitter: 'https://x.com/Cre8core_Labs'
        },
        status: 'active'
    },
    {
        id: 'onboard3',
        name: 'Onboard3',
        url: 'https://x.com/Onboard3___',
        description: 'Bringing Africa’s next 3M creators & builders into Web3. Earn $20–$300 for educational posts and community campaigns.',
        category: 'bountyHub',
        builder: {
            name: 'Onboard3',
            twitter: 'https://x.com/Onboard3___'
        },
        status: 'active'
    },
    {
        id: 'tunnl',
        name: 'Tunnl',
        url: 'https://x.com/Tunnl_io',
        description: 'Quick micro-bounties for threads, visuals, and explainers. Earn $20–$250 based on submitted content.',
        category: 'bountyHub',
        builder: {
            name: 'Tunnl',
            twitter: 'https://x.com/Tunnl_io'
        },
        status: 'active'
    },
    {
        id: 'enb-ecosystem',
        name: 'ENB Ecosystem',
        url: 'https://x.com/EverybNeedsBase',
        description: 'Opportunities, bounties, and gaming aligned with the Base network. Typical payouts: $20–$300+.',
        category: 'bountyHub',
        builder: {
            name: 'ENB Ecosystem',
            twitter: 'https://x.com/EverybNeedsBase'
        },
        status: 'active'
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        let count = 0;
        for (const item of bounties) {
            // Check if exists first to avoid duplicate errors
            const existing = await Tool.findOne({ url: item.url });
            if (!existing) {
                await Tool.create(item);
                console.log(`Added: ${item.name}`);
                count++;
            } else {
                console.log(`Skipped existing: ${item.name}`);
            }
        }
        console.log(`Done! Added ${count} platforms.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
