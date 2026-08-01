const axios = require('axios');
const Tool = require('../models/Tool');

/**
 * Maps our tool.id -> DeFiLlama parent protocol ID.
 * DeFiLlama groups sub-protocols under parent IDs like "parent#uniswap".
 * When a parent ID is specified, we aggregate TVL from ALL its children.
 * For protocols without a parent, we list individual slugs instead.
 */
const PARENT_MAP = {
    // --- Interoperability / Bridges ---
    'layerzero': { parent: 'parent#layerzero', slugs: null },
    'axelar': { parent: null, slugs: ['axelar'] },
    'stargate': { parent: 'parent#stargate-finance', slugs: null },
    'debridge': { parent: null, slugs: ['debridge'] },
    'connext': { parent: null, slugs: ['connext'] },
    'hop': { parent: null, slugs: ['hop-protocol'] },
    'across': { parent: null, slugs: ['across'] },
    'synapse': { parent: 'parent#synapse', slugs: ['synapse-cross-chain-bridge'] },
    'orbiter': { parent: null, slugs: ['orbiter-finance'] },
    'allbridge': { parent: 'parent#allbridge', slugs: ['allbridge-core', 'allbridge-classic'] },
    'meson': { parent: null, slugs: ['meson'] },
    'polyhedra': { parent: null, slugs: ['polyhedra-network'] },

    // --- DEX (Spot) ---
    'uniswap': { parent: 'parent#uniswap', slugs: null },
    'pancakeswap': { parent: 'parent#pancakeswap', slugs: null },
    'sushi': { parent: 'parent#sushiswap', slugs: ['sushiswap'] },
    'curve': { parent: 'parent#curve-finance', slugs: null },
    'balancer': { parent: 'parent#balancer', slugs: null },
    '1inch': { parent: 'parent#1inch', slugs: null },
    'cowswap': { parent: null, slugs: ['cowswap'] },
    'jupiter': { parent: 'parent#jupiter', slugs: null },
    'raydium': { parent: 'parent#raydium', slugs: null },
    'orca': { parent: 'parent#orca', slugs: null },
    'velodrome': { parent: 'parent#velodrome', slugs: null },
    'aerodrome': { parent: 'parent#aerodrome', slugs: null },
    'osmosis': { parent: 'parent#osmosis', slugs: ['osmosis-dex'] },
    'traderjoe': { parent: 'parent#trader-joe', slugs: null },
    'quickswap': { parent: 'parent#quickswap', slugs: null },
    'camelot': { parent: 'parent#camelot', slugs: null },
    'spookyswap': { parent: 'parent#spookyswap', slugs: null },
    'thena': { parent: 'parent#thena', slugs: null },
    'biswap': { parent: 'parent#biswap', slugs: null },
    'vvs': { parent: 'parent#vvs-finance', slugs: ['vvs-standard', 'vvs-flawless'] },
    'yield-yak': { parent: 'parent#yield-yak', slugs: ['yield-yak-aggregator'] },
    'mdex': { parent: null, slugs: ['mdex'] },
    'slingshot': { parent: null, slugs: ['slingshot'] },
    'carbon': { parent: null, slugs: ['carbon-defi'] },
    'shade-swap': { parent: null, slugs: ['shadeswap'] },
    'kamino-finance': { parent: 'parent#kamino', slugs: null },
    'synfutures': { parent: 'parent#synfutures', slugs: null },

    // --- Perps DEX ---
    'dydx': { parent: 'parent#dydx', slugs: null },
    'gmx': { parent: 'parent#gmx', slugs: null },
    'hyperliquid': { parent: 'parent#hyperliquid', slugs: null },
    'aevo': { parent: 'parent#aevo', slugs: null },
    'vertex': { parent: 'parent#vertex-protocol', slugs: ['vertex-perps'] },
    'perpetual-protocol': { parent: null, slugs: ['perpetual-protocol'] },
    'kwenta': { parent: null, slugs: ['kwenta'] },
    'mux': { parent: 'parent#mux-protocol', slugs: null },
    'level-finance': { parent: 'parent#level-finance', slugs: null },
    'rabbitx': { parent: null, slugs: ['rabbitx'] },
    'zkx': { parent: null, slugs: ['zkx'] },
    'drift': { parent: 'parent#drift', slugs: null },
    'orderly': { parent: 'parent#orderly-network', slugs: null },
    'lighter': { parent: 'parent#lighter', slugs: null },
    'aster': { parent: 'parent#astherus', slugs: null },

    // --- InfoFi / Other ---
    'kaito': { parent: null, slugs: ['kaito'] },

    // --- Lending / Markets ---
    'aave': { parent: 'parent#aave', slugs: null },
    'compound': { parent: 'parent#compound-finance', slugs: null },
    'maker': { parent: 'parent#makerdao', slugs: null },
    'spark': { parent: 'parent#spark', slugs: null },
    'morpho': { parent: 'parent#morpho', slugs: ['morpho-blue', 'morpho-optimizer'] },
    'venus': { parent: 'parent#venus', slugs: null },
    'radiant': { parent: 'parent#radiant-capital', slugs: null },
    'liquity': { parent: 'parent#liquity', slugs: null },
    'justlend': { parent: null, slugs: ['justlend'] },

    // --- Liquid Staking / ETH Restaking ---
    'lido': { parent: 'parent#lido', slugs: null },
    'rocket-pool': { parent: null, slugs: ['rocket-pool'] },
    'ether-fi': { parent: null, slugs: ['ether.fi'] },
    'eigenlayer': { parent: null, slugs: ['eigenlayer'] },
    'renzo': { parent: null, slugs: ['renzo'] },
    'puffer': { parent: null, slugs: ['puffer-finance'] },
    'swell': { parent: null, slugs: ['swell-network'] },
    'kelp-dao': { parent: null, slugs: ['kelp-dao'] },
    'mantle-lsp': { parent: null, slugs: ['mantle-lsp'] },

    // --- Yield / Fixed Rate ---
    'pendle': { parent: 'parent#pendle', slugs: null },
    'instadapp': { parent: 'parent#instadapp', slugs: null },
    'yield-protocol': { parent: null, slugs: ['yield-protocol'] },

    // --- Synthetics / Assets ---
    'synthetix': { parent: 'parent#synthetix', slugs: null },
    'ethena': { parent: 'parent#ethena', slugs: null },
    'frax': { parent: 'parent#frax-finance', slugs: ['frax-swap', 'frax-ether', 'fraxlend'] },
};

/**
 * Maps our tool.id -> CoinGecko ID for token price lookups.
 * Many DeFiLlama sub-protocols don't have gecko_id, so we hardcode them.
 */
const GECKO_MAP = {
    'layerzero': 'layerzero',
    'axelar': 'axelar',
    'stargate': 'stargate-finance',
    'debridge': 'debridge',
    'connext': 'connext',
    'hop': 'hop-protocol',
    'across': 'across-protocol',
    'synapse': 'synapse-2',
    'meson': 'meson-network',
    'polyhedra': 'polyhedra-network',
    'uniswap': 'uniswap',
    'pancakeswap': 'pancakeswap-token',
    'sushi': 'sushi',
    'curve': 'curve-dao-token',
    'balancer': 'balancer',
    '1inch': '1inch',
    'cowswap': 'cow-protocol',
    'jupiter': 'jupiter-exchange-solana',
    'raydium': 'raydium',
    'orca': 'orca',
    'velodrome': 'velodrome-finance',
    'aerodrome': 'aerodrome-finance',
    'osmosis': 'osmosis',
    'traderjoe': 'joe',
    'quickswap': 'quickswap',
    'camelot': 'camelot-token',
    'spookyswap': 'spookyswap',
    'thena': 'thena',
    'biswap': 'biswap',
    'vvs': 'vvs-finance',
    'yield-yak': 'yield-yak',
    'mdex': 'mdex',
    'kamino-finance': 'kamino',
    'synfutures': 'synfutures',
    'dydx': 'dydx-chain',
    'gmx': 'gmx',
    'hyperliquid': 'hyperliquid',
    'aevo': 'aevo-exchange',
    'vertex': 'vertex-protocol',
    'perpetual-protocol': 'perpetual-protocol',
    'kwenta': 'kwenta',
    'mux': 'mux-protocol',
    'rabbitx': 'rabbitx',
    'drift': 'drift-protocol',
    'orderly': 'orderly-network',
    'lighter': 'lighter',
    'aster': 'astherus',
    'kaito': 'kaito',

    // --- Lending ---
    'aave': 'aave',
    'compound': 'compound-governance-token',
    'maker': 'maker',
    'spark': 'spark',
    'morpho': 'morpho',
    'venus': 'venus',
    'radiant': 'radiant-capital',
    'liquity': 'liquity',

    // --- Liquid Staking ---
    'lido': 'lido-dao',
    'rocket-pool': 'rocket-pool',
    'ether-fi': 'ether-fi',
    'eigenlayer': 'eigenlayer',
    'renzo': 'renzo',
    'puffer': 'puffer-finance',
    'swell': 'swell-network',

    // --- Synthetics ---
    'synthetix': 'synthetix-network-token',
    'ethena': 'ethena',
    'frax': 'frax-share',

    // --- Gaming ---
    'axie-infinity': 'axie-infinity',
    'the-sandbox': 'the-sandbox',
    'decentraland': 'decentraland',
    'illuvium': 'illuvium',
    'gods-unchained': 'gods-unchained',
    'star-atlas': 'star-atlas',
    'sorare': 'sorare',
    'splinterlands': 'splinterlands',
    'parallel': 'prime-2',
    'pixels': 'pixels',
    'big-time': 'big-time',
    'guild-of-guardians': 'guild-of-guardians',
    'aurory': 'aurory',
    'blocklords': 'blocklords',
    'cornucopias': 'cornucopias',
    'treasure': 'magic',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch token prices, mcap, and fdv from CoinGecko markets API for a batch of gecko IDs.
 * Returns a Map of geckoId -> { price, mcap, fdv }.
 */
const fetchTokenPrices = async (geckoIds) => {
    if (!geckoIds.length) return new Map();
    const prices = new Map();
    
    // Batch in groups of 50 to avoid URL length limits
    const batchSize = 50;
    for (let i = 0; i < geckoIds.length; i += batchSize) {
        const batch = geckoIds.slice(i, i + batchSize);
        let retries = 3;
        while (retries > 0) {
            try {
                const { data } = await axios.get(
                    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${batch.join(',')}`,
                    { timeout: 15000 }
                );
                 for (const coin of data) {
                    prices.set(coin.id, {
                        price: coin.current_price || 0,
                        mcap: coin.market_cap || 0,
                        fdv: coin.fully_diluted_valuation || 0,
                        symbol: coin.symbol?.toUpperCase() || '',
                        change24h: coin.price_change_percentage_24h || 0,
                        volume24h: coin.total_volume || 0
                    });
                }
                break; // success
            } catch (err) {
                retries--;
                console.warn(`Token price fetch failed for batch (retries left: ${retries}):`, err.message);
                if (retries === 0) break;
                // Rate limit (429) implies CoinGecko is throttling
                const isRateLimit = err.response && err.response.status === 429;
                await delay(isRateLimit ? 5000 : 2000);
            }
        }

        // Fallback to DeFiLlama Coins API for any missing prices in this batch
        const missingFromBatch = batch.filter(id => !prices.has(id));
        if (missingFromBatch.length > 0) {
            try {
                console.log(`Fallback: fetching token prices from DeFiLlama Coins API for: ${missingFromBatch.join(', ')}`);
                const formattedIds = missingFromBatch.map(id => `coingecko:${id}`);
                const { data: llamaCoinsData } = await axios.get(
                    `https://coins.llama.fi/prices/current/${formattedIds.join(',')}`,
                    { timeout: 15000 }
                );
                if (llamaCoinsData && llamaCoinsData.coins) {
                    for (const id of missingFromBatch) {
                        const coinInfo = llamaCoinsData.coins[`coingecko:${id}`];
                        if (coinInfo) {
                            prices.set(id, {
                                price: coinInfo.price || 0,
                                mcap: prices.get(id)?.mcap || 0,
                                fdv: prices.get(id)?.fdv || 0,
                                symbol: coinInfo.symbol?.toUpperCase() || ''
                            });
                        }
                    }
                }
            } catch (llamaErr) {
                console.warn(`Fallback DeFiLlama coins fetch failed:`, llamaErr.message);
            }
        }

        // Always delay 2s between normal batches
        if (i + batchSize < geckoIds.length) {
            await delay(2000);
        }
    }
    return prices;
};

/**
 * Fetch 24h volume for DEX / perps protocols from DeFiLlama.
 * Returns a Map of slug -> volume24h.
 */
const fetchDexVolumes = async () => {
    const volumes = new Map();
    const endpoints = [
        'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume',
        'https://api.llama.fi/overview/derivatives?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume'
    ];

    for (const url of endpoints) {
        try {
            const { data } = await axios.get(url, { timeout: 20000 });
            for (const p of (data.protocols || [])) {
                if (p.total24h != null) {
                    if (p.slug) volumes.set(p.slug, (volumes.get(p.slug) || 0) + p.total24h);
                    if (p.parentProtocol) {
                        const current = volumes.get(p.parentProtocol) || 0;
                        volumes.set(p.parentProtocol, current + p.total24h);
                    }
                    if (p.name) {
                        const nameKey = p.name.toLowerCase();
                        volumes.set(nameKey, (volumes.get(nameKey) || 0) + p.total24h);
                    }
                }
            }
        } catch (err) {
            console.warn(`Volume fetch failed for ${url.includes('deriv') ? 'derivatives' : 'DEX'}:`, err.message);
        }
    }
    return volumes;
};

/**
 * Find matching DeFiLlama data for a tool using the PARENT_MAP.
 * Aggregates metrics from all child protocols of a parent.
 */
const findAndAggregate = (tool, protocols) => {
    const config = PARENT_MAP[tool.id];
    let matchedProtocols = [];

    if (!config) {
        const p = protocols.find(p => p.slug === tool.id || (tool.llamaSlug && p.slug === tool.llamaSlug));
        if (p) matchedProtocols = [p];
        else return null;
    } else {

        if (config.parent) {
            // Get ALL children of this parent protocol
            matchedProtocols = protocols.filter(p => p.parentProtocol === config.parent);
        }

        if (matchedProtocols.length === 0 && config.slugs) {
            // Fall back to explicit slugs
            matchedProtocols = config.slugs
                .map(slug => protocols.find(p => p.slug === slug))
                .filter(Boolean);
        }
    }

    if (matchedProtocols.length === 0) return null;

    // Aggregate metrics across all matched sub-protocols
    let tvl = 0, staking = 0, pool2 = 0;
    let change1h = 0, change1d = 0, change7d = 0;
    const allChains = new Set();
    let largestTvl = 0;

    // Collect all unique slugs for detail fetching
    const allSlugs = [];

    for (const p of matchedProtocols) {
        tvl += (p.tvl || 0);
        staking += (p.staking || 0);
        pool2 += (p.pool2 || 0);
        // Use change% from the sub-protocol with highest TVL
        if ((p.tvl || 0) > largestTvl) {
            largestTvl = p.tvl || 0;
            change1h = p.change_1h || 0;
            change1d = p.change_1d || 0;
            change7d = p.change_7d || 0;
        }
        for (const c of (p.chains || [])) allChains.add(c);
        if (p.slug) allSlugs.push(p.slug);
    }

    return {
        protocols: matchedProtocols,
        tvl,
        staking,
        pool2,
        change1h,
        change1d,
        change7d,
        chains: [...allChains],
        allSlugs,
        parentId: config ? config.parent : matchedProtocols[0]?.parentProtocol,
        primarySlug: matchedProtocols[0]?.slug
    };
};

/**
 * Fetch detailed chain support from /protocol/{slug} detail endpoints.
 * The detail endpoint returns chainTvls which is much more comprehensive
 * than the chains array from the /protocols list.
 * Returns a Map of slug -> Set of chain names.
 */
const fetchDetailChains = async (slugs) => {
    const chainMap = new Map();
    if (!slugs.length) return chainMap;

    // Batch in groups of 15 with small delays to avoid rate limits
    const batchSize = 15;
    for (let i = 0; i < slugs.length; i += batchSize) {
        const batch = slugs.slice(i, i + batchSize);
        const promises = batch.map(async (slug) => {
            try {
                const { data } = await axios.get(`https://api.llama.fi/protocol/${slug}`, { timeout: 5000 });
                const NON_CHAIN_KEYS = new Set(['staking', 'pool2', 'borrowed', 'offers', 'vesting', 'treasury', 'doublecounted', 'masterchef']);
                const chains = Object.keys(data.chainTvls || {}).filter(k => !k.includes('-') && !NON_CHAIN_KEYS.has(k.toLowerCase()));
                chainMap.set(slug, new Set(chains));
            } catch (e) {
                // Silently skip — we still have the list data
            }
        });
        await Promise.all(promises);
        if (i + batchSize < slugs.length) await delay(200);
    }
    return chainMap;
};

const fetchLlamaData = async () => {
    try {
        console.log('--- DeFiLlama Sync Started ---');

        // 1. Fetch all protocols from DeFiLlama
        const response = await axios.get('https://api.llama.fi/protocols', { timeout: 30000 });
        const llamaProtocols = response.data;
        console.log(`DeFiLlama protocols: ${llamaProtocols.length}`);

        // 2. Fetch DEX + Derivatives volumes
        const dexVolumes = await fetchDexVolumes();
        console.log(`Volume entries: ${dexVolumes.size}`);

        // 3. Get all tools from our DB
        const tools = await Tool.find({});
        console.log(`Local tools: ${tools.length}`);

        // 4. Match and aggregate for each tool
        const matchedPairs = [];
        const unmatchedNames = [];
        const geckoIdsToFetch = new Set();

        for (const tool of tools) {
            const result = findAndAggregate(tool, llamaProtocols);
            if (result) {
                // Determine gecko_id from GECKO_MAP (most reliable)
                const geckoId = GECKO_MAP[tool.id] || tool.geckoId || tool.id || null;
                if (geckoId) geckoIdsToFetch.add(geckoId);

                matchedPairs.push({ tool, result, geckoId });
            } else {
                unmatchedNames.push(tool.name);
            }
        }

        // 5. Batch fetch token prices, mcap, fdv from CoinGecko via DeFiLlama
        const tokenData = await fetchTokenPrices([...geckoIdsToFetch]);
        console.log(`Token data fetched for ${tokenData.size} coins`);

        // Fallback to CoinMarketCap API for any missing token data
        try {
            const { fetchCMCQuotes, CMC_SYMBOL_MAP } = require('./cmcService');
            const cmcSymbolsToFetch = [];
            for (const { tool, geckoId } of matchedPairs) {
                const coinData = geckoId ? tokenData.get(geckoId) : null;
                if (!coinData || !coinData.price) {
                    const cmcSymbol = CMC_SYMBOL_MAP[tool.id];
                    if (cmcSymbol) {
                        cmcSymbolsToFetch.push(cmcSymbol);
                    }
                }
            }

            if (cmcSymbolsToFetch.length > 0) {
                console.log(`CMC Fallback triggered for ${cmcSymbolsToFetch.length} symbols`);
                const cmcQuotes = await fetchCMCQuotes(cmcSymbolsToFetch);
                if (cmcQuotes.size > 0) {
                    for (const { tool, geckoId } of matchedPairs) {
                        const coinData = geckoId ? tokenData.get(geckoId) : null;
                        if (!coinData || !coinData.price) {
                            const cmcSymbol = CMC_SYMBOL_MAP[tool.id];
                            const quote = cmcSymbol ? cmcQuotes.get(cmcSymbol) : null;
                            if (quote) {
                                console.log(`CMC Fallback success for ${tool.id} (${cmcSymbol}): price = ${quote.price}`);
                                tokenData.set(geckoId || tool.id, {
                                    price: quote.price,
                                    mcap: quote.mcap,
                                    fdv: quote.fdv,
                                    symbol: cmcSymbol
                                });
                            }
                        }
                    }
                }
            }
        } catch (cmcErr) {
            console.warn(`CoinMarketCap fallback flow encountered error:`, cmcErr.message);
        }
        // 5b. Fetch detailed chain data from /protocol/{slug} for richer chain coverage
        // Only fetch PRIMARY slug for tools with very sparse chain data (0-2 chains)
        // to avoid slow API calls (the detail endpoint returns huge historical JSON)
        const sparseChainSlugs = new Set();
        for (const { tool, result } of matchedPairs) {
            const existingChains = tool.metrics?.chains?.length || 0;
            const llamaChains = (result.chains || []).length;
            if (Math.max(existingChains, llamaChains) < 3 && result.primarySlug) {
                sparseChainSlugs.add(result.primarySlug);
            }
        }
        console.log(`Fetching detail chain data for ${sparseChainSlugs.size} sparse-chain protocols...`);
        const detailChainMap = await fetchDetailChains([...sparseChainSlugs]);
        console.log(`Detail chain data fetched for ${detailChainMap.size} protocols`);

        // 6. Build bulk update operations
        const bulkOps = [];
        for (const { tool, result, geckoId } of matchedPairs) {
            const coinData = geckoId ? tokenData.get(geckoId) : null;
            const tokenPrice = coinData?.price || 0;
            const mcap = coinData?.mcap || 0;
            const fdv = coinData?.fdv || 0;

            // Find volume: check parent ID first, then slug, then name
            let volume24h = 0;
            if (result.parentId) {
                volume24h = dexVolumes.get(result.parentId) || 0;
            }
            if (!volume24h && result.primarySlug) {
                volume24h = dexVolumes.get(result.primarySlug) || 0;
            }
            if (!volume24h) {
                volume24h = dexVolumes.get(tool.name.toLowerCase()) || coinData?.volume24h || 0;
            }

            // Merge chains: DeFiLlama list + detail endpoint + existing DB chains
            const mergedChains = new Set(result.chains || []);
            // Add chains from detail endpoints (much richer)
            for (const slug of (result.allSlugs || [])) {
                const detailChains = detailChainMap.get(slug);
                if (detailChains) {
                    for (const c of detailChains) mergedChains.add(c);
                }
            }
            // Preserve any existing manually-curated chains from the DB
            for (const c of (tool.metrics?.chains || [])) {
                mergedChains.add(c);
            }

            const metrics = {
                tvl: result.tvl,
                tvlChange1h: result.change1h,
                tvlChange24h: result.change1d || coinData?.change24h || 0,
                tvlChange7d: result.change7d,
                mcap: mcap,
                fdv: fdv,
                tokenPrice: tokenPrice,
                tokenSymbol: coinData?.symbol || '',
                volume24h: volume24h,
                staking: result.staking,
                pool2: result.pool2,
                chains: [...mergedChains],
                lastUpdated: new Date()
            };

            bulkOps.push({
                updateOne: {
                    filter: { id: tool.id },
                    update: {
                        $set: {
                            metrics: metrics,
                            ...(tool.llamaSlug ? {} : { llamaSlug: result.primarySlug }),
                            ...(geckoId && !tool.geckoId ? { geckoId: geckoId } : {})
                        }
                    }
                }
            });
        }

        if (bulkOps.length > 0) {
            await Tool.bulkWrite(bulkOps);
        }

        console.log(`--- Sync Complete ---`);
        console.log(`Matched: ${matchedPairs.length} / ${tools.length}`);
        console.log(`Total Updated: ${bulkOps.length}`);
        if (unmatchedNames.length > 0) {
            console.log(`Unmatched (${unmatchedNames.length}): ${unmatchedNames.join(', ')}`);
        }

        return bulkOps.length;
    } catch (error) {
        console.error('Error during DeFiLlama sync:', error.message);
        throw error;
    }
};

module.exports = {
    fetchLlamaData,
    GECKO_MAP,
    PARENT_MAP
};
