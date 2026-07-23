export const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
export const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const STELLAR_EXPERT_TESTNET = "https://stellar.expert/explorer/testnet";

// Soroban specific settings
export const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

// Deployed Smart Contract IDs on Stellar Testnet
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const ROOM_MANAGER_CONTRACT_ID = import.meta.env.VITE_ROOM_MANAGER_CONTRACT_ID || "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFCT4";

// Explorer Helpers
export const getExplorerContractUrl = (contractId) => `${STELLAR_EXPERT_TESTNET}/contract/${contractId}`;
export const getExplorerTxUrl = (txHash) => `${STELLAR_EXPERT_TESTNET}/tx/${txHash}`;
export const getExplorerAccountUrl = (account) => `${STELLAR_EXPERT_TESTNET}/account/${account}`;
