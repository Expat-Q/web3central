const axios = require('axios');

// Default CoinMarketCap Sandbox Key if none provided in env
const CMC_SANDBOX_KEY = 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c';

const CMC_SYMBOL_MAP = {
    'uniswap': 'UNI',
    'aave': 'AAVE',
    'maker': 'MKR',
    'compound': 'COMP',
    'lido': 'LDO',
    'rocket-pool': 'RPL',
    'ether-fi': 'ETHFI',
    'eigenlayer': 'EIGEN',
    'pendle': 'PENDLE',
    'synthetix': 'SNX',
    'ethena': 'ENA',
    'frax': 'FXS',
    'debridge': 'DBR',
    'synapse': 'SYN',
    'stargate': 'STG',
    'layerzero': 'ZRO',
    'across': 'ACX',
    'hop': 'HOP',
    'connext': 'NEXT',
    'rabbitx': 'RBX',
    'vertex': 'VRTX',
    'drift': 'DRIFT',
    'biswap': 'BSW',
    'gmx': 'GMX',
    'velodrome': 'VELO',
    'aerodrome': 'AERO',
    'jupiter': 'JUP',
    'raydium': 'RAY',
    'orca': 'ORCA',
    'pancakeswap': 'CAKE',
    'sushi': 'SUSHI',
    'curve': 'CRV',
    'balancer': 'BAL',
    '1inch': '1INCH',
    'cowswap': 'COW',
    'traderjoe': 'JOE',
    'axie-infinity': 'AXS',
    'the-sandbox': 'SAND',
    'decentraland': 'MANA',
    'illuvium': 'ILV',
    'gods-unchained': 'GODS',
    'star-atlas': 'ATLAS',
    'splinterlands': 'SPS',
    'parallel': 'PRIME',
    'pixels': 'PIXEL',
    'big-time': 'BIGTIME',
    'guild-of-guardians': 'GOG',
    'aurory': 'AURY',
    'blocklords': 'LRDS',
    'cornucopias': 'COPI',
    'treasure': 'MAGIC'
};

/**
 * Fetch token quotes from CoinMarketCap by symbols.
 * Returns a Map of symbol -> { price, mcap, fdv, change24h }.
 */
const fetchCMCQuotes = async (symbols) => {
    if (!symbols.length) return new Map();
    
    const apiKey = process.env.COINMARKETCAP_API_KEY || CMC_SANDBOX_KEY;
    const isSandbox = apiKey === CMC_SANDBOX_KEY;
    const baseUrl = isSandbox 
        ? 'https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
        : 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
        
    const quotes = new Map();
    
    try {
        console.log(`CMC API: Fetching quotes for symbols: ${symbols.join(', ')} (Sandbox: ${isSandbox})`);
        const { data } = await axios.get(baseUrl, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey,
                'Accept': 'application/json'
            },
            params: {
                symbol: symbols.join(','),
                convert: 'USD'
            },
            timeout: 10000
        });

        if (data && data.data) {
            for (const sym of symbols) {
                const coinDataArray = data.data[sym];
                if (coinDataArray) {
                    // CMC can return an array or single object depending on version/query
                    const coin = Array.isArray(coinDataArray) ? coinDataArray[0] : coinDataArray;
                    const usdQuote = coin.quote?.USD;
                    if (usdQuote) {
                        quotes.set(sym, {
                            price: usdQuote.price || 0,
                            mcap: usdQuote.market_cap || 0,
                            fdv: usdQuote.fully_diluted_valuation || usdQuote.market_cap || 0,
                            change24h: usdQuote.percent_change_24h || 0
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.warn(`CoinMarketCap API request failed:`, err.response?.data?.status?.error_message || err.message);
    }
    
    return quotes;
};

module.exports = {
    fetchCMCQuotes,
    CMC_SYMBOL_MAP
};
