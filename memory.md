# Web3Central Project Memory

This file serves as the source of truth for the current state of Web3Central and the roadmap for new features.

## Project Vision
Web3Central is a comprehensive directory for Web3 applications, focusing on user experience, detailed metrics, and community feedback.

## Current State (May 7, 2026)
- **Authentication**: JWT-based auth with support for Google, Discord, and Twitter.
- **Tool Directory**: 200+ dApps across various categories (DeFi, Trading, Gaming, etc.).
- **Metrics**: Real-time TVL, user counts, and trending scores.
- **Developer Console**: Allows developers to claim and publish apps (currently requires a fee).
- **Click Tracking**: Global state tracking for app launches.

## Feature Roadmap & Status

### 1. Free dApp Listing
- **Goal**: Remove the 0.001 ETH listing fee to encourage more submissions.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Remove "On-Chain Fee" step from `PublishApp.jsx`.
  - [x] Update backend `submit` route to bypass Etherscan verification.

### 2. Taxonomy Expansion
- **Goal**: Add new high-growth categories.
- **New Categories**: Infra & Dev Tools, AI, Social & DeSoc, DAOs & Governance, DePIN, Staking & Restaking, Payments & On-ramps, Airdrops.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Update `CategorySidebar.jsx`.
  - [x] Update `CategoryPage.jsx`.
  - [x] Update `PublishApp.jsx` category list.

### 3. Gamification: Diamonds & Quests
- **Goal**: User engagement via XP (Diamonds).
- **Features**:
  - Quest Page for task completion.
  - Diamonds awarded for reviews and ratings.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Update `User` model with `diamonds` field.
  - [x] Create `Quests.jsx` page.
  - [x] Add reward logic to review submission API.

### 4. Airdrop Integration
- **Goal**: Highlight projects with active or upcoming airdrops.
- **Features**:
  - "Airdrop" tag for projects.
  - Dedicated Airdrop category.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Add `hasAirdrop` to `Tool` model.
  - [x] Add tag UI to `ProtocolCard`.

### 5. Multi-Chain Filtering
- **Goal**: Allow users to filter apps by the chain they support.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Add chain selector to `CategoryPage.jsx`.
  - [x] Implement filtering logic in frontend.

### 6. AI Voice: ElevenLabs
- **Goal**: Audio descriptions for projects.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Integrate ElevenLabs API (Browser TTS used as fallback).
  - [x] Add "Play Description" button to `MetricsPanel`.

### 7. BagsApp Integration: Reputation Keys
- **Goal**: Social-fi betting on project reputation.
- **Status**: ✅ Completed
- **Tasks**:
  - [x] Design and implement "Reputation Key" UI in `MetricsPanel`.

---

## Technical Context
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Storage**: Cloudinary/Local for images.
- **APIs**: DeFiLlama (TVL), CoinGecko (Price), ElevenLabs (Voice).
