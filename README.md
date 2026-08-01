# Web3Central - Data-Driven Web3 OS & Verified Protocol Intelligence
> **The Verified Protocol Directory, Real-Time On-Chain Intelligence & Security Platform**

Web3Central extends modern data analytics and safety scanning to the Web3 ecosystem. Instead of relying on unverified user links or static spreadsheets, it indexes, verifies, monitors, and analyzes smart contracts, DeFi protocols, and Web3 tools using automated metric pipelines and intelligent security tools.

---

## Philosophy
**Data-Driven, Safe, and Transparent:**

- **Verified-First** — Every protocol URL and domain is verified against phishing clones
- **Real-Time On-Chain Data** — TVL, trading volume, token prices, and chain distributions synced live
- **Multi-Modal Analysis** — Combines on-chain metrics, GitHub commit activity, and user sentiment
- **Automated Health Monitoring** — Continuous uptime and domain verification checks

---

## Why Web3Central?
The Web3 ecosystem faces critical usability and security challenges:

- **Phishing & Scam Dominance** — Search engine results frequently surface fake/clone protocol domains
- **Fragmented Metrics** — Protocol TVL, volumes, code commits, and sentiment are scattered across multiple tools
- **Lack of Verification** — Users lack a unified, trustworthy directory for safe interaction

Web3Central serves as the **"Verified Operating System"** for decentralized applications — automated, transparent, and built for safety.

---

## Targets & Ecosystem Coverage

### Phase 1: Core Web3 Infrastructure (Current)
- **DeFi & Lending** (Aave, Compound, Maker, Lido)
- **Trading & DEXs** (Uniswap, Raydium, Hyperliquid, Jupiter)
- **Wallets & Storage** (MetaMask, Phantom, Safe, Trust Wallet)
- **NFTs & Marketplaces** (OpenSea, Blur, Magic Eden)
- **AI & Data Protocols** (Fetch.ai, Render, Bittensor)

### Phase 2: Multi-Chain Protocols (Supported)
- Ethereum
- Solana
- Base
- BNB Chain
- Polygon
- Arbitrum / Optimism

---

## Comparison: Traditional Directories vs Web3Central

| Aspect | Traditional Directory | Web3Central |
| :--- | :--- | :--- |
| **Verification** | Unverified / Paid Listing | Verified domain matching & phishing checks |
| **Data Sync** | Static / Manual entry | Real-time (DeFiLlama, CoinGecko, GitHub) |
| **Safety** | None (Risk of phishing links) | Integrated URL Safety Scanner & domain lookup |
| **Metrics Depth** | Surface-level description | TVL, 24h Volume, GitHub 30d commits, Sentiment |
| **User Experience** | Cluttered / Generic UI | Modern Microsoft Store-style layout & hover cards |
| **Monitoring** | One-time entry | Continuous health & status checks |

---

## Architecture Overview

```text
                    ┌────────────────────────────────┐
                    │   User & Explorer Interface    │
                    └──────────────┬─────────────────┘
                                   │
                                   ▼
                    ┌──────────────┴────────────────────┐
                    │  Search & Safety Scanning Layer   │
                    └──────────────┬────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │ URL Safety  │         │ Category    │         │ Top Charts  │
    │ Scanner     │         │ Rows        │         │ Table       │
    └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ▼
                   ┌─────────────────────────────────┐
                   │    Data Sync & Metric Pipeline  │
                   │    (Node.js / Express Cron Engine)│
                   └──────────────┬──────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │ DeFiLlama   │        │ CoinGecko   │        │ GitHub      │
    │ (TVL/Vol)   │        │ / CMC API   │        │ Commits API │
    └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
                                  ▼
                   ┌─────────────────────────────────┐
                   │    MongoDB Atlas Store & Cache  │
                   └─────────────────────────────────┘
```

---

## Core Components

### 1. Verification & Safety Engine
- **Domain Verification**: Matches input domains against official protocol registries.
- **Phishing Detection**: Identifies mimic domains and alerts users before interaction.
- **Click Tracking**: Secure redirect handlers to ensure users exit to verified domains only.

### 2. Metric & Analytics Pipeline
- **TVL & Volume Sync**: Automated hourly synchronization with DeFiLlama API.
- **Market Price Layer**: Real-time token pricing backed by CoinGecko and CoinMarketCap.
- **Code Activity Tracker**: 30-day GitHub commit window tracking developer momentum.

### 3. User Experience & Discovery
- **Microsoft Store Hero Layout**: Dynamic spotlight carousel featuring top trending protocols.
- **Interactive Hover Cards**: Quick portal tooltips displaying description, ratings, and chain tags on hover.
- **Curated Navigation**: Streamlined 5-category home view with full access via `/apps`.

---

## Technology Stack

```text
┌─────────────────────────────────────────────────────┐
│                   User Interface                    │
│      React 18 / Tailwind CSS / Framer Motion        │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              App Routes & State Layer               │
│          React Router v6 / Context API              │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ REST API      │       │ Auth & Security│
│ Express.js    │       │ JWT / Passport│
└───────┬───────┘       └───────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│                 Database & External APIs            │
│   MongoDB Atlas / DeFiLlama / CoinGecko / GitHub    │
└─────────────────────────────────────────────────────┘
```

### Languages & Frameworks
- **Frontend**: JavaScript (React 18), Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express.js, Mongoose ODM
- **Database**: MongoDB Atlas
- **External Services**: DeFiLlama API, CoinGecko API, CoinMarketCap API, GitHub REST API

---

## Roadmap

### v0.1 (Current Release)
- [x] Refactored Microsoft Store-style Hero & unified AppCards
- [x] Portal-rendered Protocol Hover Cards
- [x] Top Charts analytics table & chain filtering
- [x] URL Safety & Phishing Scanner
- [x] Streamlined 5-category homepage + sidebar navigation

### v0.2 (Developer Public API)
- [ ] Rate-limited API keys via Developer Console
- [ ] Public endpoints for protocol verification and metric lookups
- [ ] Official JavaScript/TypeScript SDK (`npm install web3central-sdk`)

### v0.3 (AI Rating Engine & Health Check)
- [ ] Multi-signal AI Trust Score (0–100) & A+ to F Letter Grades
- [ ] Automated 15-minute HTTP uptime & domain health monitoring
- [ ] On-chain contract fallback parser for unlisted DeFiLlama protocols

### v0.4 (Crypto Twitter Intelligence & Early Discovery)
- [ ] Automated Crypto Twitter (X) monitoring engine to track early-stage Web3 announcements & stealth project launches
- [ ] Social growth metrics pipeline (follower velocity, influencer engagement, narrative trends)
- [ ] Early discovery radar feed for newly detected protocols prior to mainnet listing

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas Instance
- Environment configuration file (`.env`)

### Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/Admuad/web3central.git
   cd web3central
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Run Application**
   ```bash
   # Start Frontend (Terminal 1)
   npm start

   # Start Backend (Terminal 2)
   cd backend
   npm run dev
   ```

---

## Security & Privacy
- **Zero Raw Key Storage**: Sensitive operational keys remain strictly in environment variables.
- **Strict Role-Based Auth**: Admin operations require verified JWT bearer tokens with administrative roles.
- **Sanitized Redirects**: All external protocol links route safely to prevent clickjacking and open redirects.

---

## License
Proprietary — All rights reserved.

---
*Built with ❤️ for a safer and more transparent Web3.*
