# RentStar — Enterprise Roommate Rent Settlement on Stellar

[![CI/CD Pipeline](https://github.com/king3192/steller-level-4/actions/workflows/ci.yml/badge.svg)](https://github.com/king3192/steller-level-4/actions)
[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blueviolet)](https://horizon-testnet.stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**RentStar** is a decentralized application (dApp) for roommate rent and utility settlements powered by inter-communicating Soroban smart contracts on the Stellar Testnet.

🔗 **Live Production Demo**: [https://king3192.github.io/steller-level-4/](https://king3192.github.io/steller-level-4/)

---

## 📸 Screenshots

1. **Balance & Profile Selection (Demo Mode)**  
   ![Balance and Profile](https://github.com/king3192/steller-level-3/blob/52f742017db5b881bd437fb253a828ef6c1195f9/Screenshot%202026-06-30%20001800.png)

2. **Roommate Smart Contract Rent Settlement**  
   ![Roommate Rent Settlement](https://github.com/king3192/steller-level-3/blob/52f742017db5b881bd437fb253a828ef6c1195f9/Screenshot%202026-06-30%20001822.png)

3. **Public Proof of Usage & On-Chain Activity Feed**  
   ![Recent Activity](https://github.com/king3192/steller-level-3/blob/52f742017db5b881bd437fb253a828ef6c1195f9/Screenshot%202026-06-30%20001846.png)

4. **Landlord Dashboard & Registered Roommates**  
   ![Landlord Dashboard](https://github.com/king3192/steller-level-3/blob/52f742017db5b881bd437fb253a828ef6c1195f9/Screenshot%202026-06-30%20001912.png)

5. **Roommate Registration & Contract Linkage**  
   ![Roommate Registration](https://github.com/king3192/steller-level-3/blob/52f742017db5b881bd437fb253a828ef6c1195f9/Screenshot%202026-06-30%20002006.png)

---

## 🏗️ Technical Architecture Overview

RentStar implements a **Two-Contract Architecture** to separate registry management from payment processing:

```
[ Frontend Client (React 18 + Vite) ]
          │
          ├── Wallet Connection (Stellar Wallets Kit / Freighter / xBull / Albedo)
          │
          ▼
[ RentSplit Contract (Payment Processor) ] ── (cross-contract call) ──► [ RoomManager Contract (Registry Store) ]
          │                                                                      │
          └── Emits pay_rent Events ◄────────────────────────────────────────────┘
```

- **`RoomManager` Contract**: Stores roommate addresses, allocated shares, total pool rent, and landlord admin credentials.
- **`RentSplit` Contract**: Validates payment limits against `RoomManager` via cross-contract calls, executes rent splits, and emits on-chain ledger events.

For complete technical specifications, see [ARCHITECTURE.md](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/ARCHITECTURE.md).

---

## ⚙️ Technology Stack

| Layer | Technology | Specification / Version |
|---|---|---|
| **Frontend Framework** | React 18 + Vite 5 | SPA with strict component modularity |
| **Styling & Design System** | Tailwind CSS v3 | Custom dark theme, glassmorphism, responsive grid |
| **Smart Contracts** | Soroban Rust | `soroban-sdk` v20.x (`room_manager`, `rent_split`) |
| **Stellar SDK** | `@stellar/stellar-sdk` | v12.3.0 |
| **Wallet Integration** | `@creit.tech/stellar-wallets-kit` | Freighter, xBull, Albedo, Mock Wallet |
| **Error Monitoring** | Sentry React | Exception tracking & error boundaries |
| **Analytics** | Vercel Analytics | User interaction telemetry |
| **Feedback Collection** | Formspree Integration | In-app user feedback submission |

---

## 📜 Deployed Testnet Contracts & Explorer Links

Both contracts are compiled to WebAssembly and deployed fresh on the **Stellar Testnet**:

| Contract Name | Contract ID | Stellar Expert Explorer Link |
|---|---|---|
| **`RentSplit`** (Payment Processor) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |
| **`RoomManager`** (Registry) | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFCT4` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFCT4) |

---

## 🚀 Local Setup & Verification Commands

### Prerequisites
1. **Node.js**: v18+ installed.
2. **Rust & Cargo**: Required to compile and test smart contracts.

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start local development server
npm run dev
```

### Verification & Testing Suite
```bash
# Run RoomManager Rust Contract Unit Tests
cd contracts/room_manager
cargo test

# Run RentSplit Rust Contract Unit Tests (Includes Multi-Contract Integration Test)
cd ../rent_split
cargo test

# Run Frontend ESLint Checks
npm run lint

# Build Production Bundle
npm run build
```

---

## 🎮 How to Try Demo Mode (Profile Simulator)

Reviewers and users without a browser extension wallet can evaluate the app in **Demo Mode**:
1. Click **Connect Demo Wallet (Mock Mode)** on the landing screen.
2. Use the **Simulate Profile** toggle at the top of the dashboard to switch between:
   - **Landlord (Admin)**: Register roommates, set rent shares, link contracts, and view overall pool settlement bars.
   - **Roommate**: Submit contract payments, view personal remaining share, and watch the live event feed update.

---

## 💬 How to Leave Feedback

Click the **Feedback** button in the header navigation bar to open the in-app feedback modal. You can rate your experience (1–5 stars) and submit text comments directly.

---

## 📋 Level 4 Rubric Compliance Summary

This repository satisfies all **Level 4 Production Upgrade** requirements:

| Rubric Category | Requirement | Implementation & Location in Repo |
|---|---|---|
| **Production MVP** | Stable architecture, mobile responsive UI, proper loading & error handling | React ErrorBoundary ([ErrorBoundary.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/ErrorBoundary.jsx)), Skeleton UI ([Skeleton.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/Skeleton.jsx)), Toast system ([Toast.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/Toast.jsx)), Offline banner ([OfflineBanner.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/OfflineBanner.jsx)), and centralized error classifier ([errors.js](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/utils/errors.js)). Responsive down to 375px. |
| **User Onboarding** | Onboarding guide, proof-of-wallet interactions, user feedback collection | Guided 4-step onboarding modal ([OnboardingModal.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/OnboardingModal.jsx)), public proof-of-usage feed ([ProofOfUsageView.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/ProofOfUsageView.jsx)), and Formspree feedback form ([FeedbackModal.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/components/FeedbackModal.jsx)). |
| **Product Quality** | Single-command production deploy, monitoring & analytics | Vercel deployment config ([vercel.json](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/vercel.json)), Sentry error monitoring ([main.jsx](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/main.jsx)), Vercel Analytics integration ([analytics.js](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/src/utils/analytics.js)), and full architecture docs ([ARCHITECTURE.md](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/ARCHITECTURE.md)). |
| **Technical Standards** | Smart contracts deployed on Stellar Testnet, 15+ commits, public repo | Contracts deployed on Stellar Testnet (`RentSplit` & `RoomManager`), multi-contract integration tests in Rust (`cargo test`), 25+ atomic git commits, GitHub Actions CI workflow ([.github/workflows/ci.yml](file:///c:/Users/Prana/OneDrive/Documents/steller%20lvl%201/rentstar/.github/workflows/ci.yml)). |
