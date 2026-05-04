const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Tool = require('../models/Tool');

const ALLOWED_CATEGORIES = [
    "trading", "defi", "bridges", "wallets", "security", 
    "analytics", "nft", "gaming", "community", "rwa", 
    "cex", "privacy", "predictions", "bounty-hub"
];

const CATEGORY_MAP = {
    "dex": "trading",
    "dex aggregator": "trading",
    "perps": "trading",
    "perpetuals": "trading",
    "derivatives": "trading",
    "lending": "defi",
    "borrowing": "defi",
    "lending / borrowing": "defi",
    "lending/borrowing": "defi",
    "yield": "defi",
    "yield optimization": "defi",
    "yield vault": "defi",
    "stablecoin": "defi",
    "liquidity management": "defi",
    "defi tool": "defi",
    "liquid staking token (lsts)": "defi",
    "liquid staking": "defi",
    "bridge": "bridges",
    "wallet": "wallets",
    "self-custody": "wallets",
    "security": "security",
    "security tool": "security",
    "audit": "security",
    "data": "analytics",
    "explorer": "analytics",
    "analytics": "analytics",
    "nft": "nft",
    "nft tool": "nft",
    "marketplace": "nft",
    "nft marketplace": "nft",
    "gaming": "gaming",
    "game": "gaming",
    "gamefi": "gaming",
    "rpg": "gaming",
    "action": "gaming",
    "strategy": "gaming",
    "casual": "gaming",
    "adventure": "gaming",
    "social": "community",
    "community": "community",
    "creator": "community",
    "dao": "community",
    "dao tool": "community",
    "real world": "rwa",
    "real world assets (rwas)": "rwa",
    "rwa": "rwa",
    "centralized exchange": "cex",
    "cex": "cex",
    "privacy": "privacy",
    "identity": "privacy",
    "ai": "defi", // Temp mapping
    "depin": "defi", // Temp mapping
    "predictions": "predictions",
    "bounties": "bounty-hub",
    "bounty": "bounty-hub",
    "payments": "defi",
    "fiat on-ramp": "wallets",
    "developer tool": "analytics",
    "infra & tools (other)": "analytics",
    "infra": "analytics"
};

function parseMdFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    const dapps = [];
    let i = 0;
    
    while (i < lines.length) {
        // Skip purely numeric lines (counts)
        if (lines[i].match(/^[0-9]+$/)) { i++; continue; }

        if (lines[i].includes(' logo') || lines[i].startsWith('Logo of')) {
            const dapp = {};
            
            if (lines[i].startsWith('Logo of ')) {
                dapp.name = lines[i].replace('Logo of ', '');
            } else {
                dapp.name = lines[i].replace(' logo', '');
            }
            
            i++;
            if (lines[i] === 'Arbitrum Native' || lines[i] === 'Coming Soon') i++;
            if (lines[i] === dapp.name) i++;
            
            // Handle URL or description
            if (lines[i].includes('.') && !lines[i].includes(' ')) {
                dapp.url = lines[i];
                if (!dapp.url.startsWith('http')) dapp.url = 'https://' + dapp.url;
                i++;
            }
            
            dapp.description = lines[i];
            i++;
            
            dapp.tags = [];
            // Collect tags until next dapp or numeric line
            while (i < lines.length && !lines[i].includes(' logo') && !lines[i].startsWith('Logo of')) {
                if (lines[i].match(/^[0-9]+$/)) break;
                if (lines[i].length > 50) break; 
                dapp.tags.push(lines[i]);
                i++;
            }
            dapps.push(dapp);
        } else {
            i++;
        }
    }
    return dapps;
}

async function prepareOnboarding(fileNames = ['base_ecosystem_dapps.md', 'arbitrum_dappps']) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const existingTools = await Tool.find({}, { name: 1, url: 1 });
        const existingNames = new Set(existingTools.map(t => t.name.toLowerCase()));
        const existingUrls = new Set(existingTools.map(t => t.url?.replace(/\/$/, '').toLowerCase()));

        console.log('Fetching DefiLlama protocols...');
        const llamaRes = await axios.get('https://api.llama.fi/protocols');
        const llamaProtocols = llamaRes.data;

        const allPending = [];

        for (const fileName of fileNames) {
            const mdPath = path.join(__dirname, '../../', fileName);
            if (!fs.existsSync(mdPath)) continue;

            console.log(`Processing ${fileName}...`);
            const parsedDapps = parseMdFile(mdPath);
            console.log(`Found ${parsedDapps.length} total dapps in ${fileName}.`);

            for (const item of parsedDapps) {
                const normalizedUrl = item.url ? item.url.replace(/\/$/, '').toLowerCase() : '';
                if (existingNames.has(item.name.toLowerCase()) || (normalizedUrl && existingUrls.has(normalizedUrl))) {
                    continue;
                }

                let targetCategory = null;
                for (const tag of item.tags) {
                    const normalizedTag = tag.toLowerCase();
                    if (CATEGORY_MAP[normalizedTag]) {
                        targetCategory = CATEGORY_MAP[normalizedTag];
                        break;
                    }
                    if (ALLOWED_CATEGORIES.includes(normalizedTag)) {
                        targetCategory = normalizedTag;
                        break;
                    }
                }

                if (!targetCategory) continue;

                const match = llamaProtocols.find(p => 
                    p.name.toLowerCase() === item.name.toLowerCase() ||
                    (p.url && normalizedUrl && p.url.replace(/\/$/, '').toLowerCase() === normalizedUrl)
                );

                // STRICT FILTER: Must have on-chain metrics or be a verified protocol
                if (!match) continue; // Skip if no on-chain match found
                if (match.tvl < 10000 && !match.verified) continue; // Skip if usage is too low (<$10k)

                let onboardingItem = {
                    id: item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    name: item.name,
                    url: item.url || match.url || "",
                    description: item.description || match.description || "",
                    category: targetCategory,
                    tags: [...new Set([...item.tags, ...(match.chains || [])])],
                    builder: { name: item.name + " Team", handle: "" },
                    status: "pending",
                    verified: !!match.verified,
                    metrics: { tvl: match.tvl || 0, mcap: match.mcap || 0 }
                };

                onboardingItem.llamaSlug = match.slug;
                onboardingItem.builder.handle = match.twitter ? "@" + match.twitter : "";
                onboardingItem.builder.twitter = match.twitter ? `https://twitter.com/${match.twitter}` : "";
                onboardingItem.logoUrl = match.logo;
                
                if (match.tvl > 500000) { 
                    onboardingItem.status = "active"; 
                    onboardingItem.verified = true; 
                }

                allPending.push(onboardingItem);
            }
        }

        allPending.sort((a, b) => (b.metrics.tvl || 0) - (a.metrics.tvl || 0));

        const outputPath = path.join(__dirname, '../data/pending_onboarding.json');
        fs.writeFileSync(outputPath, JSON.stringify(allPending, null, 2));

        console.log(`Summary:`);
        console.log(`- New protocols staged for review: ${allPending.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

prepareOnboarding();
