/**
 * restoreMissingProtocols.js
 * Upserts all known missing protocols back into the DB.
 * SAFE: Uses upsert — will not wipe existing data.
 *
 * Usage: node scripts/restoreMissingProtocols.js
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Tool = require('../models/Tool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mk = (id, name, category, url, description, tags, twitterHandle) => ({
  id, name, category, url, description,
  tags,
  builder: { name, handle: twitterHandle, twitter: `https://twitter.com/${twitterHandle.replace('@','')}` },
  status: 'active',
  verified: true,
  trending: false,
  recentlyAdded: false,
});

const PROTOCOLS = [

  // ── NFT ──────────────────────────────────────────────────────────
  mk('opensea',   'OpenSea',   'nft', 'https://opensea.io',   'The largest NFT marketplace for buying, selling and discovering digital assets.', ['Marketplace','Ethereum','Multi-chain'], '@opensea'),
  mk('magiceden', 'Magic Eden', 'nft', 'https://magiceden.io', 'Multi-chain NFT marketplace pioneering Solana, Bitcoin, and EVM NFTs.', ['Marketplace','Solana','Multi-chain'], '@MagicEden'),
  mk('blur',      'Blur',       'nft', 'https://blur.io',      'NFT marketplace for pro traders with aggregated listings and real-time analytics.', ['Marketplace','Aggregator','Pro'], '@blur_io'),
  mk('zora',      'Zora',       'nft', 'https://zora.co',      'Open protocol for creating and collecting NFTs with no platform fees.', ['Minting','Ethereum','Open'], '@ourzora'),
  mk('foundation','Foundation', 'nft', 'https://foundation.app','NFT marketplace for digital creators and collectors.', ['Marketplace','Art','Curated'], '@withfoundation'),
  mk('superrare', 'SuperRare',  'nft', 'https://superrare.com','Curated marketplace for single-edition digital artworks.', ['Art','Single-edition','Curated'], '@SuperRare'),
  mk('rarible',   'Rarible',    'nft', 'https://rarible.com',  'Community-owned NFT marketplace supporting multiple blockchains.', ['Marketplace','Multi-chain','DAO'], '@rarible'),
  mk('manifold',  'Manifold',   'nft', 'https://manifold.xyz', 'Creator tools for minting and selling NFTs with custom contracts.', ['Creator Tools','Minting','Smart Contracts'], '@manifoldxyz'),
  mk('mintfun',   'Mint.fun',   'nft', 'https://mint.fun',     'Discover and mint new NFT drops across multiple chains.', ['Minting','Discovery','Multi-chain'], '@mintdotfun'),
  mk('artblocks', 'Art Blocks', 'nft', 'https://artblocks.io', 'Generative art platform producing algorithmically created on-chain art.', ['Generative Art','On-chain','Curated'], '@artblocks_io'),
  mk('sound-xyz', 'Sound.xyz',  'nft', 'https://sound.xyz',    'Music NFT platform empowering artists and fans through on-chain music.', ['Music','Creator','Minting'], '@SoundxyzArt'),
  mk('highlight', 'Highlight',  'nft', 'https://highlight.xyz','NFT minting platform for creators, featuring editions and open editions.', ['Minting','Creator','Editions'], '@highlightxyz'),

  // ── Wallets ──────────────────────────────────────────────────────
  mk('metamask',       'MetaMask',       'wallets', 'https://metamask.io',     'The most popular self-custodial Web3 wallet for Ethereum and EVM chains.', ['Ethereum','EVM','Browser Extension'], '@MetaMask'),
  mk('phantom',        'Phantom',        'wallets', 'https://phantom.app',     'Friendly multi-chain crypto wallet for Solana, Ethereum, and Bitcoin.', ['Solana','Multi-chain','Mobile'], '@phantom'),
  mk('rabby-wallet',   'Rabby Wallet',   'wallets', 'https://rabby.io',        'EVM wallet with built-in security checks and pre-transaction simulation.', ['EVM','Security','Simulation'], '@Rabby_io'),
  mk('rainbow-wallet', 'Rainbow',        'wallets', 'https://rainbow.me',      'Beautiful Ethereum wallet making crypto fun and accessible.', ['Ethereum','Mobile','UX'], '@rainbowdotme'),
  mk('coinbase-wallet','Coinbase Wallet','wallets', 'https://wallet.coinbase.com','Self-custody wallet by Coinbase with deep Base network integration.', ['Ethereum','Base','Mobile'], '@coinbasewallet'),
  mk('backpack-wallet','Backpack',        'wallets', 'https://backpack.app',   'Multi-chain wallet with native xNFT app ecosystem on Solana.', ['Solana','xNFT','Multi-chain'], '@xBackpack'),
  mk('ledger-live',    'Ledger Live',    'wallets', 'https://ledger.com',      'Hardware wallet platform with full DeFi and NFT management via Ledger devices.', ['Hardware','Cold Storage','Security'], '@Ledger'),
  mk('trezor-suite',   'Trezor Suite',   'wallets', 'https://trezor.io',       'Open-source hardware wallet suite for maximum security and self-sovereignty.', ['Hardware','Cold Storage','Open Source'], '@Trezor'),
  mk('trust-wallet',   'Trust Wallet',   'wallets', 'https://trustwallet.com', 'Secure and decentralized mobile crypto wallet supporting 100+ blockchains.', ['Mobile','Multi-chain','Multi-asset'], '@TrustWallet'),
  mk('safe',           'Safe',           'wallets', 'https://safe.global',     'Battle-tested multi-sig smart account wallet used by DAOs and institutions.', ['Multi-sig','Smart Account','DAO'], '@safe_global'),
  mk('zerion',         'Zerion',         'wallets', 'https://zerion.io',       'Smart wallet and DeFi portfolio tracker across all major chains.', ['DeFi','Portfolio','Multi-chain'], '@zerion'),
  mk('argent',         'Argent',         'wallets', 'https://argent.xyz',      'Smart wallet with social recovery and native Starknet support.', ['Smart Wallet','Starknet','Recovery'], '@argentHQ'),
  mk('solflare',       'Solflare',       'wallets', 'https://solflare.com',    'Solana wallet with staking, DeFi, and NFT management built-in.', ['Solana','Staking','NFT'], '@solflare_wallet'),
  mk('keplr',          'Keplr',          'wallets', 'https://keplr.app',       'The gateway wallet for the interchain (Cosmos ecosystem).', ['Cosmos','IBC','Interchain'], '@keplrwallet'),
  mk('okx-wallet',     'OKX Wallet',     'wallets', 'https://okx.com/web3',   'Multi-chain Web3 wallet with built-in DEX, Bridge, and NFT features.', ['Multi-chain','DEX','Bridge'], '@okxweb3'),
  mk('petra',          'Petra',          'wallets', 'https://petra.app',       'Official Aptos wallet developed by the Aptos Labs team.', ['Aptos','Layer 1','Official'], '@PetraWallet'),

  // ── Security ─────────────────────────────────────────────────────
  mk('revoke-cash',   'Revoke.cash',     'security', 'https://revoke.cash',          'View and revoke your ERC-20 and NFT token approvals to protect your wallet.', ['Approvals','Ethereum','Multi-chain'], '@RevokeCash'),
  mk('goplus',        'GoPlus Security', 'security', 'https://gopluslabs.io',        'Decentralized, open Web3 security infrastructure for token and wallet checks.', ['Security API','Risk Detection','Infrastructure'], '@GoplusSecurity'),
  mk('immunefi',      'Immunefi',        'security', 'https://immunefi.com',         'The leading Web3 bug bounty platform protecting billions in crypto.', ['Bug Bounty','Audits','Protection'], '@immunefi'),
  mk('certik',        'CertiK',          'security', 'https://certik.com',           'Web3 security firm offering smart contract audits and on-chain monitoring.', ['Audits','Monitoring','Security'], '@CertiK'),
  mk('sherlock',      'Sherlock',        'security', 'https://sherlock.xyz',         'Smart contract security marketplace connecting auditors with protocols.', ['Audits','Insurance','Bug Bounty'], '@sherlockdefi'),
  mk('openzeppelin',  'OpenZeppelin',    'security', 'https://openzeppelin.com',     'Trusted open-source framework for building secure smart contracts.', ['Smart Contracts','Library','Audits'], '@OpenZeppelin'),
  mk('forta-network', 'Forta',           'security', 'https://forta.network',        'Decentralized real-time threat detection network for Web3 protocols.', ['Threat Detection','Monitoring','Real-time'], '@FortaNetwork'),
  mk('blockaid',      'Blockaid',        'security', 'https://blockaid.io',          'Real-time malicious transaction detection embedded in wallets and dApps.', ['Transaction Screening','Simulation','Wallet Safety'], '@blockaid_io'),
  mk('blowfish',      'Blowfish',        'security', 'https://blowfish.xyz',         'Transaction scanning and phishing protection embedded in wallets.', ['Phishing','Simulation','Wallet Safety'], '@blowfishxyz'),
  mk('wallet-guard',  'Wallet Guard',    'security', 'https://walletguard.app',      'Browser extension that protects against phishing, scams, and drainer attacks.', ['Browser Extension','Phishing','Protection'], '@wallet_guard'),
  mk('pocket-universe','Pocket Universe', 'security', 'https://pocketuniverse.app',  'Transaction simulator and scam detector for Ethereum and other EVM chains.', ['Simulation','Scam Detection','EVM'], '@PocketUniverseZ'),
  mk('scam-sniffer',  'Scam Sniffer',    'security', 'https://scamsniffer.io',       'Real-time malicious site and signature detection for Web3 users.', ['Phishing','Malware','Protection'], '@realScamSniffer'),
  mk('slowmist',      'SlowMist',        'security', 'https://slowmist.com',         'Blockchain security firm providing audits and threat intelligence.', ['Audits','Threat Intel','Security'], '@SlowMist_Team'),
  mk('peckshield',    'PeckShield',      'security', 'https://peckshield.com',       'Blockchain security and data analytics firm specializing in DeFi safety.', ['Audits','Data Analytics','Security'], '@peckshield'),
  mk('hexagate',      'Hexagate',        'security', 'https://hexagate.com',         'Real-time blockchain threat intelligence and alerting for protocols.', ['Threat Intel','Monitoring','Real-time'], '@HexagateHQ'),
  mk('hypernative',   'Hypernative',     'security', 'https://hypernative.io',       'Proactive security platform detecting and preventing Web3 threats in real-time.', ['Threat Prevention','Monitoring','Proactive'], '@hypernative_io'),
  mk('sol-incinerator','Sol Incinerator', 'security', 'https://sol-incinerator.com', 'Burn spam and unwanted tokens from your Solana wallet to reclaim SOL rent.', ['Solana','Wallet Cleaning','Spam'], '@SolIncinerator'),

  // ── Privacy ──────────────────────────────────────────────────────
  mk('aztec-network', 'Aztec',           'privacy', 'https://aztec.network',   'Privacy-first ZK-rollup enabling confidential transactions on Ethereum.', ['ZK','Rollup','Confidential'], '@aztecnetwork'),
  mk('railgun',       'RAILGUN',         'privacy', 'https://railgun.org',     'Smart contract privacy system for DeFi transactions using ZK proofs.', ['ZK','DeFi','Private Transactions'], '@railgun_project'),
  mk('secret-network','Secret Network',  'privacy', 'https://scrt.network',    'Layer 1 blockchain with encrypted smart contracts for privacy-preserving dApps.', ['Layer 1','Encrypted','Smart Contracts'], '@SecretNetwork'),
  mk('zcash',         'Zcash',           'privacy', 'https://z.cash',          'Privacy-focused cryptocurrency using zk-SNARKs for shielded transactions.', ['ZK-SNARKs','Shielded','Privacy Coin'], '@zcash'),
  mk('aleph-zero',    'Aleph Zero',      'privacy', 'https://alephzero.org',   'Privacy-enhancing blockchain with ZK proofs and institutional-grade privacy.', ['ZK','Layer 1','Privacy'], '@Aleph__Zero'),
  mk('iron-fish',     'Iron Fish',       'privacy', 'https://ironfish.network', 'Privacy-first blockchain with encrypted transactions for every block.', ['Encrypted','Layer 1','Privacy Coin'], '@ironfishcrypto'),
  mk('phala-network', 'Phala Network',   'privacy', 'https://phala.network',   'Web3 cloud protocol providing confidential computing for blockchain dApps.', ['Confidential Computing','TEE','Substrate'], '@PhalaNetwork'),

  // ── Predictions ──────────────────────────────────────────────────
  mk('polymarket',          'Polymarket',       'predictions', 'https://polymarket.com',       'Leading decentralized prediction market for real-world events.', ['Prediction Markets','Real World','Polygon'], '@Polymarket'),
  mk('azuro',               'Azuro',            'predictions', 'https://azuro.org',            'Decentralized betting and prediction market protocol.', ['Betting','Sports','Protocol'], '@azuroprotocol'),
  mk('overtime-markets',    'Overtime Markets', 'predictions', 'https://overtimemarkets.xyz',  'Decentralized sports betting on top of Azuro and Thales protocols.', ['Sports Betting','Thales','Optimism'], '@OvertimeMarkets'),
  mk('augur',               'Augur',            'predictions', 'https://augur.net',            'Decentralized prediction market platform on Ethereum.', ['Prediction Markets','Ethereum','Decentralized'], '@AugurProject'),
  mk('polkamarkets',        'Polkamarkets',     'predictions', 'https://polkamarkets.com',     'DeFi-powered prediction markets for real world events.', ['Prediction Markets','DeFi','Multi-chain'], '@polkamarkets'),
  mk('zeitgeist',           'Zeitgeist',        'predictions', 'https://zeitgeist.pm',         'Substrate-based prediction market protocol on Polkadot/Kusama.', ['Polkadot','Substrate','Prediction Markets'], '@ZeitgeistPM'),
  mk('sx-network',          'SX Network',       'predictions', 'https://sx.bet',               'The world\'s largest blockchain-based sports betting network.', ['Sports Betting','Polygon','Protocol'], '@sx_network'),
  mk('gnosis-conditional',  'Omen',             'predictions', 'https://omen.eth.link',        'Decentralized prediction market platform built on Gnosis infrastructure.', ['Prediction Markets','Gnosis','Ethereum'], '@GnosisPM'),

  // ── Gaming ───────────────────────────────────────────────────────
  mk('axie-infinity',    'Axie Infinity',    'gaming', 'https://axieinfinity.com', 'Pioneer play-to-earn game with NFT creatures called Axies.', ['Play-to-Earn','NFT','Ronin'], '@AxieInfinity'),
  mk('the-sandbox',      'The Sandbox',      'gaming', 'https://sandbox.game',    'Decentralized virtual gaming world on Ethereum.', ['Metaverse','Virtual World','Polygon'], '@TheSandboxGame'),
  mk('decentraland',     'Decentraland',     'gaming', 'https://decentraland.org','Open virtual world where players own their land as NFTs.', ['Metaverse','VR','Ethereum'], '@decentraland'),
  mk('gods-unchained',   'Gods Unchained',   'gaming', 'https://godsunchained.com','Free-to-play trading card game with true card ownership via NFTs.', ['Trading Card','NFT','Free-to-Play'], '@GodsUnchained'),
  mk('illuvium',         'Illuvium',         'gaming', 'https://illuvium.io',     'Open-world RPG and auto-battler with crypto rewards.', ['RPG','Auto-battler','ILV'], '@illuviumio'),
  mk('star-atlas',       'Star Atlas',       'gaming', 'https://staratlas.com',   'Grand space strategy game built entirely on Solana.', ['Strategy','Solana','Metaverse'], '@staratlas'),
  mk('sorare',           'Sorare',           'gaming', 'https://sorare.com',      'Global fantasy football game with officially licensed NFT cards.', ['Fantasy Sports','Football','NFT'], '@Sorare'),
  mk('splinterlands',    'Splinterlands',    'gaming', 'https://splinterlands.com','Popular blockchain-based trading card game with play-to-earn mechanics.', ['Trading Card','Play-to-Earn','WAX'], '@splinterlands'),
  mk('parallel',         'Parallel',         'gaming', 'https://parallel.life',   'Sci-fi trading card game with NFT card ownership and tournaments.', ['Trading Card','NFT','Sci-Fi'], '@ParallelTCG'),
  mk('pixels',           'Pixels',           'gaming', 'https://pixels.xyz',      'Online farming RPG game on Ronin with play-and-earn mechanics.', ['RPG','Farming','Ronin'], '@pixels_online'),
  mk('big-time',         'Big Time',         'gaming', 'https://bigtime.gg',      'Multi-player action RPG with time-travel mechanics and NFT cosmetics.', ['RPG','Action','NFT Cosmetics'], '@BigTimeStudios'),
  mk('guild-of-guardians','Guild of Guardians','gaming','https://guildofguardians.com','Mobile RPG dungeon crawler with guild-based play-to-earn.', ['Mobile','RPG','Guild'], '@GuildGuardians'),
  mk('aurory',           'Aurory',           'gaming', 'https://aurory.io',       'Solana-based RPG game with PvP and PvE modes using NFT characters.', ['Solana','RPG','PvP'], '@AuroryProject'),

  // ── Bounty Hub ───────────────────────────────────────────────────
  mk('wizz',           'Wizz',           'bountyHub', 'https://x.com/WizzHQ',           'Agentic bounty platform paying creators for threads, memes & articles ($50-$300+).', ['Bounties','Creator','Content'], '@WizzHQ'),
  mk('stallion',       'Stallion',       'bountyHub', 'https://earnstallions.xyz',       'Connecting global talents to Web3 earning opportunities ($20-$300).', ['Bounties','Stellar','Content'], '@stallionsearn'),
  mk('first-dollar',   'First Dollar',   'bountyHub', 'https://app.firstdollar.money',   'Beginner-friendly earn platform powered by InnerCircle ($20-$300).', ['Beginner','Earn','Content'], '@earnfirstdollar'),
  mk('scribble',       'Scribble',       'bountyHub', 'https://x.com/scribble_dao',      'Earn platform for creators: research posts, videos & threads ($30-$300).', ['Creator','Research','Content'], '@scribble_dao'),
  mk('gib-work',       'Gib.Work',       'bountyHub', 'https://x.com/gib_work',          'Create work, take on work, and get paid in crypto ($20-$250).', ['Freelance','Crypto Pay','Tasks'], '@gib_work'),
  mk('superteam-earn', 'Superteam Earn', 'bountyHub', 'https://earn.superteam.fun',      'High-paying Solana bounties and freelance gigs ($100-$2,500+).', ['Solana','High Pay','Freelance'], '@SuperteamEarn'),
  mk('cre8core',       'Cre8core Labs',  'bountyHub', 'https://cre8core.fun',             'The creative layer of Base — infinite campaigns, endless rewards.', ['Base','Campaigns','Creator'], '@Cre8core_Labs'),
  mk('onboard3',       'Onboard3',       'bountyHub', 'https://x.com/Onboard3___',        'Bringing Africa\'s next 3M creators into Web3 with educational bounties.', ['Africa','Education','Onboarding'], '@Onboard3___'),
  mk('tunnl',          'Tunnl',          'bountyHub', 'https://x.com/Tunnl_io',           'Quick micro-bounties for threads, visuals and explainers ($20-$250).', ['Micro-bounties','Content','Fast Pay'], '@Tunnl_io'),
  mk('enb-ecosystem',  'ENB Ecosystem',  'bountyHub', 'https://x.com/EverybNeedsBase',   'Opportunities, bounties and gaming aligned with the Base network.', ['Base','Gaming','Community'], '@EverybNeedsBase'),
  mk('layer3',         'Layer3',         'bountyHub', 'https://layer3.xyz',               'Quests and bounties rewarding crypto users for learning and contributing.', ['Quests','Rewards','Education'], '@layer3xyz'),
  mk('crew3',          'Zealy (Crew3)',  'bountyHub', 'https://zealy.io',                 'Community engagement platform with quests, sprints and XP rewards.', ['Community','Quests','XP'], '@ZealyApp'),
  mk('dework',         'Dework',         'bountyHub', 'https://dework.xyz',               'Web3 project management and bounty tool for DAOs and communities.', ['DAO','Project Management','Bounties'], '@deworkxyz'),
];

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let added = 0, updated = 0;
  const byCat = {};

  for (const proto of PROTOCOLS) {
    const existing = await Tool.findOne({ id: proto.id });
    if (existing) {
      await Tool.findOneAndUpdate({ id: proto.id }, { $set: { status: 'active', ...proto } });
      updated++;
    } else {
      await Tool.create(proto);
      added++;
    }
    byCat[proto.category] = (byCat[proto.category] || 0) + 1;
    console.log(`  [${proto.category}] ${proto.name} — ${existing ? 'updated' : 'added'}`);
  }

  const total = await Tool.countDocuments();
  console.log('\n─────────────────────────────────────');
  console.log(`✅ Done! Added: ${added}, Updated: ${updated}`);
  console.log('Category breakdown:');
  Object.entries(byCat).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`\n📦 Total tools in DB: ${total}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
