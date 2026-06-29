# Deployment Instructions for RentStar Multi-Contract System

Follow these instructions to compile, deploy, initialize, and cross-link the `RoomManager` and `RentSplit` Soroban smart contracts on the Stellar Testnet.

---

## 🏗️ Multi-Contract Architecture

RentStar uses a two-contract system for enterprise rent settlements:
1. **`RoomManagerContract`**: Stores roommate registrations, rent shares, payment histories, and the landlord's admin address.
2. **`RentSplitContract`**: Accumulates split payments and verifies payment limits by querying the `RoomManager` contract.

Both contracts must be deployed, initialized, and linked to allow proper communication.

---

## ⚙️ Prerequisites

Ensure you have the following installed on your system:
- **Rust and Cargo**: [Install Rust](https://www.rust-lang.org/tools/install)
- **Stellar CLI**: Install via cargo:
  ```bash
  cargo install --locked stellar-cli --features opt
  ```
- **Wasm target**: Add WebAssembly target compilation:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar Account (Testnet)**:
  - Generate an identity: `stellar keys generate --global admin`
  - Fund it via Friendbot: `https://friendbot.stellar.org/?addr=<ADMIN_PUBLIC_KEY>`

---

## 🚀 1. Automated Deployment (Recommended)

An automated deployment orchestrator script is provided. It handles building, deploying, initializing, cross-linking, updating `.env`, and generating bindings.

### Windows (PowerShell)
From the `rentstar/` folder:
```powershell
./deploy-all.ps1
```

### Linux / macOS / Git Bash
From the `rentstar/` folder:
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

---

## 🛠️ 2. Manual Deployment Steps

If you prefer to execute commands manually:

### Step A: Build the WASM binaries
Compile both crates:
```bash
# In rentstar/contracts/room_manager/
stellar contract build

# In rentstar/contracts/rent_split/
stellar contract build
```

### Step B: Deploy the Contracts
Deploy the WebAssembly bytecode to Stellar Testnet:
```bash
# Deploy RoomManager
ROOM_MANAGER_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/room_manager.wasm \
  --source admin \
  --network testnet)

# Deploy RentSplit
RENT_SPLIT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/rent_split.wasm \
  --source admin \
  --network testnet)
```

### Step C: Initialize & Link Contracts
Run invocation commands to set contract owners and linkages:

1. **Initialize RoomManager** (set landlord admin):
   ```bash
   stellar contract invoke \
     --id "$ROOM_MANAGER_ID" \
     --source admin \
     --network testnet \
     -- \
     initialize \
     --admin <LANDLORD_PUBLIC_KEY>
   ```

2. **Initialize RentSplit** (set RoomManager reference):
   ```bash
   stellar contract invoke \
     --id "$RENT_SPLIT_ID" \
     --source admin \
     --network testnet \
     -- \
     initialize \
     --room_manager "$ROOM_MANAGER_ID"
   ```

3. **Link RentSplit in RoomManager** (enable payment recording authorization):
   ```bash
   stellar contract invoke \
     --id "$ROOM_MANAGER_ID" \
     --source admin \
     --network testnet \
     -- \
     set_rent_split \
     --rent_split "$RENT_SPLIT_ID"
   ```

---

## 📋 3. Update Frontend Configurations

Generate TypeScript interfaces for client interactions and update the `.env` settings:

```bash
# Generate RoomManager Bindings
stellar contract bindings typescript \
  --contract-id "$ROOM_MANAGER_ID" \
  --network testnet \
  --output-dir src/utils/room-manager-bindings --overwrite

# Generate RentSplit Bindings
stellar contract bindings typescript \
  --contract-id "$RENT_SPLIT_ID" \
  --network testnet \
  --output-dir src/utils/contract-bindings --overwrite
```

Update your `.env` file in the `rentstar/` root:
```env
VITE_CONTRACT_ID="<DEPLOYED_RENT_SPLIT_CONTRACT_ID>"
VITE_ROOM_MANAGER_CONTRACT_ID="<DEPLOYED_ROOM_MANAGER_CONTRACT_ID>"
VITE_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_HORIZON_URL="https://horizon-testnet.stellar.org"
```

---

## 🔄 4. Rollback & Upgrade Procedures

### Upgrading Logic
To change contract logic while maintaining roommate shares:
1. Re-compile the modified `rent_split` contract and redeploy it to get a new `RENT_SPLIT_ID`.
2. Link the new `RENT_SPLIT_ID` in `RoomManager` by calling `set_rent_split` from the admin identity.
3. Update the `VITE_CONTRACT_ID` in the `.env` file and rebuild the frontend. The existing roommates and shares in `RoomManager` will remain completely unaffected!

### Rollback Strategy
If a deployment fails or exhibits issues:
1. Re-link the previous `RENT_SPLIT_ID` in `RoomManager` by calling `set_rent_split` with the older contract address.
2. Update the `.env` file to reference the older `RENT_SPLIT_ID` and rebuild the client application.
