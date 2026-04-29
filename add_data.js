const fs = require('fs');
const path = './src/data/appsData.js';
let content = fs.readFileSync(path, 'utf8');

const additionalData = {
  cex: [
    { id: 'binance', name: 'Binance', url: 'https://binance.com', description: 'Leading centralized exchange with deep liquidity.', category: 'cex', tags: ['CEX', 'Trading'], builder: { name: 'Binance', handle: '@binance' }, status: 'active', verified: true, trending: true },
    { id: 'coinbase', name: 'Coinbase', url: 'https://coinbase.com', description: 'Secure and compliant centralized exchange platform.', category: 'cex', tags: ['CEX', 'Fiat Onramp'], builder: { name: 'Coinbase', handle: '@coinbase' }, status: 'active', verified: true, trending: false },
    { id: 'kraken', name: 'Kraken', url: 'https://kraken.com', description: 'Reliable centralized exchange offering pro trading tools.', category: 'cex', tags: ['CEX', 'Pro'], builder: { name: 'Kraken', handle: '@krakenfx' }, status: 'active', verified: true, trending: false },
    { id: 'okx', name: 'OKX', url: 'https://okx.com', description: 'Innovative centralized exchange with Web3 wallet features.', category: 'cex', tags: ['CEX', 'Derivatives'], builder: { name: 'OKX', handle: '@okx' }, status: 'active', verified: true, trending: false }
  ],
  privacy: [
    { id: 'aztec', name: 'Aztec', url: 'https://aztec.network', description: 'Privacy-first zk-rollup on Ethereum.', category: 'privacy', tags: ['ZK', 'Privacy'], builder: { name: 'Aztec', handle: '@aztecnetwork' }, status: 'active', verified: true, trending: true },
    { id: 'railgun', name: 'Railgun', url: 'https://railgun.org', description: 'Smart contract privacy system for DeFi.', category: 'privacy', tags: ['Privacy', 'DeFi'], builder: { name: 'Railgun', handle: '@railgun_project' }, status: 'active', verified: true, trending: false },
    { id: 'secret', name: 'Secret Network', url: 'https://scrt.network', description: 'Layer 1 blockchain with privacy-preserving smart contracts.', category: 'privacy', tags: ['L1', 'Privacy'], builder: { name: 'Secret Network', handle: '@SecretNetwork' }, status: 'active', verified: true, trending: false }
  ],
  wallets: [
    { id: 'metamask', name: 'MetaMask', url: 'https://metamask.io', description: 'Leading self-custodial Web3 wallet.', category: 'wallets', tags: ['Wallet', 'Ethereum'], builder: { name: 'Consensys', handle: '@MetaMask' }, status: 'active', verified: true, trending: true },
    { id: 'phantom', name: 'Phantom', url: 'https://phantom.app', description: 'Friendly multi-chain crypto wallet.', category: 'wallets', tags: ['Wallet', 'Solana'], builder: { name: 'Phantom', handle: '@phantom' }, status: 'active', verified: true, trending: false },
    { id: 'rabby', name: 'Rabby', url: 'https://rabby.io', description: 'Game-changing wallet for Ethereum and all EVM chains.', category: 'wallets', tags: ['Wallet', 'EVM'], builder: { name: 'DeBank', handle: '@Rabby_io' }, status: 'active', verified: true, trending: false },
    { id: 'trustwallet', name: 'Trust Wallet', url: 'https://trustwallet.com', description: 'Secure multi-chain crypto wallet.', category: 'wallets', tags: ['Wallet', 'Mobile'], builder: { name: 'Trust Wallet', handle: '@TrustWallet' }, status: 'active', verified: true, trending: false }
  ],
  analytics: [
    { id: 'defillama', name: 'DefiLlama', url: 'https://defillama.com', description: 'Open and transparent DeFi TVL and analytics.', category: 'analytics', tags: ['Analytics', 'TVL'], builder: { name: 'DefiLlama', handle: '@DefiLlama' }, status: 'active', verified: true, trending: true },
    { id: 'dune', name: 'Dune Analytics', url: 'https://dune.com', description: 'Community-driven blockchain data platform.', category: 'analytics', tags: ['Analytics', 'Data'], builder: { name: 'Dune', handle: '@DuneAnalytics' }, status: 'active', verified: true, trending: true },
    { id: 'nansen', name: 'Nansen', url: 'https://nansen.ai', description: 'Blockchain analytics platform enriching data with millions of wallet labels.', category: 'analytics', tags: ['Analytics', 'Onchain'], builder: { name: 'Nansen', handle: '@nansen_ai' }, status: 'active', verified: true, trending: false },
    { id: 'arkham', name: 'Arkham', url: 'https://arkhamintelligence.com', description: 'Deanonymizing the blockchain with AI.', category: 'analytics', tags: ['Analytics', 'AI'], builder: { name: 'Arkham', handle: '@ArkhamIntel' }, status: 'active', verified: true, trending: false }
  ],
  security: [
    { id: 'revoke', name: 'Revoke.cash', url: 'https://revoke.cash', description: 'Manage and revoke your token approvals.', category: 'security', tags: ['Security', 'Approvals'], builder: { name: 'Revoke', handle: '@RevokeCash' }, status: 'active', verified: true, trending: true },
    { id: 'goplus', name: 'GoPlus Security', url: 'https://gopluslabs.io', description: 'Open, permissionless, user-driven security infrastructure.', category: 'security', tags: ['Security', 'Infra'], builder: { name: 'GoPlus', handle: '@GoplusSecurity' }, status: 'active', verified: true, trending: false },
    { id: 'certik', name: 'CertiK', url: 'https://certik.com', description: 'Web3 security and smart contract auditing.', category: 'security', tags: ['Security', 'Audit'], builder: { name: 'CertiK', handle: '@CertiK' }, status: 'active', verified: true, trending: false }
  ],
  nft: [
    { id: 'opensea', name: 'OpenSea', url: 'https://opensea.io', description: 'The largest NFT marketplace.', category: 'nft', tags: ['NFT', 'Marketplace'], builder: { name: 'OpenSea', handle: '@opensea' }, status: 'active', verified: true, trending: true },
    { id: 'magiceden', name: 'Magic Eden', url: 'https://magiceden.io', description: 'Multi-chain NFT platform.', category: 'nft', tags: ['NFT', 'Solana'], builder: { name: 'Magic Eden', handle: '@MagicEden' }, status: 'active', verified: true, trending: false }
  ]
};

const appsData = require('./src/data/appsData.js');
let hasChanges = false;
for (const [key, val] of Object.entries(additionalData)) {
  if (!appsData[key] || appsData[key].length <= 1) {
    console.log('Adding data for', key);
    // Find the last closing brace of module.exports = {
    content = content.replace(/};\s*$/, ",\n  " + key + ": " + JSON.stringify(val, null, 2).replace(/^/gm, '  ').trimStart() + "\n};");
    hasChanges = true;
  }
}

// Add more to predictions
if (appsData.predictions && appsData.predictions.length <= 2) {
  const morePredictions = [
    { id: 'azuro', name: 'Azuro', url: 'https://azuro.org', description: 'Decentralized prediction markets and betting protocol.', category: 'predictions', tags: ['Predictions', 'Betting'], builder: { name: 'Azuro', handle: '@azuroprotocol' }, status: 'active', verified: true, trending: false },
    { id: 'gnosis', name: 'Gnosis', url: 'https://gnosis.io', description: 'Infrastructure for prediction markets.', category: 'predictions', tags: ['Predictions', 'Infra'], builder: { name: 'Gnosis', handle: '@gnosisPM' }, status: 'active', verified: true, trending: false }
  ];
  content = content.replace(/predictions:\s*\[/, "predictions: [\n    " + JSON.stringify(morePredictions[0], null, 4).replace(/^/gm, '    ') + ",\n    " + JSON.stringify(morePredictions[1], null, 4).replace(/^/gm, '    ') + ",");
  hasChanges = true;
  console.log('Adding more predictions');
}

if (hasChanges) {
  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated appsData.js');
} else {
  console.log('No updates needed');
}
