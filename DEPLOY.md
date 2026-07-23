# RentStar Deployment Guide (Contracts & Vercel Production)

This guide provides step-by-step instructions for deploying the **Soroban Smart Contracts** to Stellar Testnet and hosting the **React Frontend** on Vercel.

---

## 🛠️ 1. Smart Contract Deployment on Stellar Testnet

RentStar utilizes two inter-communicating Soroban contracts:
1. `RoomManager` (Registry for roommate shares and landlord admin controls)
2. `RentSplit` (Payment processing engine with cross-contract calls)

### Automated Deployment (PowerShell or Bash)
From the root `rentstar/` folder:

```powershell
# Windows PowerShell
./deploy-all.ps1
```

```bash
# Linux / macOS / Git Bash
chmod +x deploy-all.sh
./deploy-all.sh
```

The script will automatically:
1. Compile both Rust crates to WebAssembly target (`target/wasm32-unknown-unknown/release/*.wasm`).
2. Deploy both contracts to Stellar Testnet using `stellar contract deploy`.
3. Initialize `RoomManager` with the deployer admin key.
4. Initialize `RentSplit` with the `RoomManager` address.
5. Cross-link `RentSplit` in `RoomManager` via `set_rent_split`.
6. Update `.env` with deployed Contract IDs and regenerate TypeScript bindings.

---

## 🚀 2. Vercel Production Deployment

The React SPA is configured for zero-config single-command deployment on Vercel.

### Prerequisites
Install Vercel CLI or connect your GitHub repository in the Vercel Dashboard:
```bash
npm install -g vercel
```

### Deploying via Vercel CLI
From the root `rentstar/` folder:
```bash
vercel --prod
```

### Environment Variables to Configure on Vercel
In the Vercel project settings, add the following environment variables:

| Key | Description | Example / Default |
|---|---|---|
| `VITE_HORIZON_URL` | Horizon Testnet URL | `https://horizon-testnet.stellar.org` |
| `VITE_NETWORK_PASSPHRASE` | Network Passphrase | `Test SDF Network ; September 2015` |
| `VITE_SOROBAN_RPC_URL` | Soroban RPC URL | `https://soroban-testnet.stellar.org` |
| `VITE_CONTRACT_ID` | RentSplit Contract ID | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| `VITE_ROOM_MANAGER_CONTRACT_ID` | RoomManager Contract ID | `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFCT4` |
| `VITE_FEEDBACK_FORM_ID` | Formspree Form ID (Optional) | `x...` |
| `VITE_SENTRY_DSN` | Sentry React DSN (Optional) | `https://...@...ingest.sentry.io/...` |

---

## 🧪 3. Post-Deployment Verification

1. Verify live URL opens cleanly without console errors.
2. Click **Connect Demo Wallet (Mock Mode)** to verify Landlord & Roommate flows.
3. Check the **Public Proof of Usage Feed** (`/activity` or tab) to verify testnet contract explorer links.
