#!/usr/bin/env bash
# Bash script to deploy RoomManager and RentSplit contracts on Stellar Testnet
# and configure their cross-contract references.

set -e

echo "=========================================================="
echo "   RentStar Automated Multi-Contract Deployer & Linker    "
echo "=========================================================="

# Configuration
NETWORK="testnet"
ADMIN_IDENTITY="admin"
RPC_URL="https://soroban-testnet.stellar.org:443"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Verify Stellar CLI
if ! command -v stellar &> /dev/null; then
    echo "Error: Stellar CLI ('stellar') is not installed."
    echo "Please install it: cargo install --locked stellar-cli --features opt"
    exit 1
fi

# 1. Build contracts
echo -e "\n[1/7] Building Smart Contracts..."
cd contracts/room_manager
stellar contract build
cd ../rent_split
stellar contract build
cd ../..
echo "✓ Both contracts compiled to WASM successfully!"

# 2. Deploy RoomManager
echo -e "\n[2/7] Deploying RoomManager Contract..."
ROOM_MANAGER_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/room_manager.wasm \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK" | tr -d '\r\n')
echo "✓ RoomManager Deployed! ID: $ROOM_MANAGER_ID"

# 3. Deploy RentSplit
echo -e "\n[3/7] Deploying RentSplit Contract..."
RENT_SPLIT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/rent_split.wasm \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK" | tr -d '\r\n')
echo "✓ RentSplit Deployed! ID: $RENT_SPLIT_ID"

# 4. Initialize RoomManager
echo -e "\n[4/7] Initializing RoomManager contract..."
ADMIN_PUBKEY=$(stellar keys address "$ADMIN_IDENTITY" | tr -d '\r\n')
stellar contract invoke \
    --id "$ROOM_MANAGER_ID" \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_PUBKEY"
echo "✓ RoomManager initialized with Admin: $ADMIN_PUBKEY"

# 5. Initialize RentSplit
echo -e "\n[5/7] Initializing RentSplit contract..."
stellar contract invoke \
    --id "$RENT_SPLIT_ID" \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --room_manager "$ROOM_MANAGER_ID"
echo "✓ RentSplit initialized with RoomManager: $ROOM_MANAGER_ID"

# 6. Link RentSplit in RoomManager
echo -e "\n[6/7] Linking RentSplit contract in RoomManager..."
stellar contract invoke \
    --id "$ROOM_MANAGER_ID" \
    --source "$ADMIN_IDENTITY" \
    --network "$NETWORK" \
    -- \
    set_rent_split \
    --rent_split "$RENT_SPLIT_ID"
echo "✓ Contracts cross-linked successfully!"

# 7. Update .env Config & Generate Bindings
echo -e "\n[7/7] Updating frontend config & generating client bindings..."

echo "Generating bindings for RoomManager..."
stellar contract bindings typescript \
    --contract-id "$ROOM_MANAGER_ID" \
    --network "$NETWORK" \
    --output-dir src/utils/room-manager-bindings --overwrite

echo "Generating bindings for RentSplit..."
stellar contract bindings typescript \
    --contract-id "$RENT_SPLIT_ID" \
    --network "$NETWORK" \
    --output-dir src/utils/contract-bindings --overwrite

# Write new IDs to .env file
cat << EOF > .env
VITE_CONTRACT_ID="$RENT_SPLIT_ID"
VITE_ROOM_MANAGER_CONTRACT_ID="$ROOM_MANAGER_ID"
VITE_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_HORIZON_URL="https://horizon-testnet.stellar.org"
EOF

echo "✓ .env file updated with new contract addresses."
echo "=========================================================="
echo "   Upgrade complete! Deployed, configured, and bound.     "
echo "=========================================================="
