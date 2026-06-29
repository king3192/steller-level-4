# PowerShell script to deploy RoomManager and RentSplit contracts on Stellar Testnet
# and configure their cross-contract references.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RentStar Automated Multi-Contract Deployer & Linker    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Configuration (Modify as needed)
$NETWORK = "testnet"
$ADMIN_IDENTITY = "admin"
$RPC_URL = "https://soroban-testnet.stellar.org:443"
$NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"

# Verify Stellar CLI is installed
if (-not (Get-Command stellar -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Stellar CLI ('stellar') is not installed." -ForegroundColor Red
    Write-Host "Please install it via: cargo install --locked stellar-cli --features opt" -ForegroundColor Yellow
    exit 1
}

# 1. Build contracts
Write-Host "`n[1/7] Building Smart Contracts..." -ForegroundColor Yellow
Write-Host "Building RoomManager contract..." -ForegroundColor Gray
Push-Location contracts/room_manager
stellar contract build
Pop-Location

Write-Host "Building RentSplit contract..." -ForegroundColor Gray
Push-Location contracts/rent_split
stellar contract build
Pop-Location

Write-Host "✓ Both contracts compiled to WASM successfully!" -ForegroundColor Green

# 2. Deploy RoomManager
Write-Host "`n[2/7] Deploying RoomManager Contract..." -ForegroundColor Yellow
$ROOM_MANAGER_ID = (stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/room_manager.wasm `
    --source $ADMIN_IDENTITY `
    --network $NETWORK).Trim()

Write-Host "✓ RoomManager Deployed! ID: $ROOM_MANAGER_ID" -ForegroundColor Green

# 3. Deploy RentSplit
Write-Host "`n[3/7] Deploying RentSplit Contract..." -ForegroundColor Yellow
$RENT_SPLIT_ID = (stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/rent_split.wasm `
    --source $ADMIN_IDENTITY `
    --network $NETWORK).Trim()

Write-Host "✓ RentSplit Deployed! ID: $RENT_SPLIT_ID" -ForegroundColor Green

# 4. Initialize RoomManager
# Parameters: admin (address)
Write-Host "`n[4/7] Initializing RoomManager contract..." -ForegroundColor Yellow
$ADMIN_PUBKEY = (stellar keys address $ADMIN_IDENTITY).Trim()
stellar contract invoke `
    --id $ROOM_MANAGER_ID `
    --source $ADMIN_IDENTITY `
    --network $NETWORK `
    -- `
    initialize `
    --admin $ADMIN_PUBKEY

Write-Host "✓ RoomManager initialized with Admin: $ADMIN_PUBKEY" -ForegroundColor Green

# 5. Initialize RentSplit
# Parameters: room_manager (address)
Write-Host "`n[5/7] Initializing RentSplit contract..." -ForegroundColor Yellow
stellar contract invoke `
    --id $RENT_SPLIT_ID `
    --source $ADMIN_IDENTITY `
    --network $NETWORK `
    -- `
    initialize `
    --room_manager $ROOM_MANAGER_ID

Write-Host "✓ RentSplit initialized with RoomManager: $ROOM_MANAGER_ID" -ForegroundColor Green

# 6. Link RentSplit in RoomManager
# Parameters: rent_split (address)
Write-Host "`n[6/7] Linking RentSplit contract in RoomManager..." -ForegroundColor Yellow
stellar contract invoke `
    --id $ROOM_MANAGER_ID `
    --source $ADMIN_IDENTITY `
    --network $NETWORK `
    -- `
    set_rent_split `
    --rent_split $RENT_SPLIT_ID

Write-Host "✓ Contracts cross-linked successfully!" -ForegroundColor Green

# 7. Update .env Config & Generate Bindings
Write-Host "`n[7/7] Updating frontend config & generating client bindings..." -ForegroundColor Yellow

# Generate TypeScript bindings for RoomManager
Write-Host "Generating bindings for RoomManager..." -ForegroundColor Gray
stellar contract bindings typescript `
    --contract-id $ROOM_MANAGER_ID `
    --network $NETWORK `
    --output-dir src/utils/room-manager-bindings --overwrite

# Generate TypeScript bindings for RentSplit
Write-Host "Generating bindings for RentSplit..." -ForegroundColor Gray
stellar contract bindings typescript `
    --contract-id $RENT_SPLIT_ID `
    --network $NETWORK `
    --output-dir src/utils/contract-bindings --overwrite

# Write new IDs to .env file
$ENV_CONTENT = @"
VITE_CONTRACT_ID="$RENT_SPLIT_ID"
VITE_ROOM_MANAGER_CONTRACT_ID="$ROOM_MANAGER_ID"
VITE_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_HORIZON_URL="https://horizon-testnet.stellar.org"
"@

$ENV_CONTENT | Out-File -FilePath .env -Encoding utf8 -Force
Write-Host "✓ .env file updated with new contract addresses." -ForegroundColor Green
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   Upgrade complete! Deployed, configured, and bound.     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
