import { rpc, Contract, Address, scValToNative, TransactionBuilder, Account, TimeoutInfinite } from '@stellar/stellar-sdk';
import { SOROBAN_RPC_URL, CONTRACT_ID, ROOM_MANAGER_CONTRACT_ID, NETWORK_PASSPHRASE } from '../constants/network';

// Initialize Soroban RPC Server client
export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// Contract helper instances
export const rentContract = new Contract(CONTRACT_ID);
export const roomManagerContract = new Contract(ROOM_MANAGER_CONTRACT_ID);

/**
 * Simulates a contract invocation (read-only call) for a specific contract.
 * 
 * @param {Contract} contractInstance The Contract instance to query.
 * @param {string} functionName Name of the contract function to call.
 * @param {Array} args Array of scVal arguments.
 * @returns {Promise<any>} The native JavaScript representation of the return value.
 */
export async function simulateContractCall(contractInstance, functionName, args = []) {
  // Use a dummy account and sequence number for simulation
  const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
  
  const tx = new TransactionBuilder(dummyAccount, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  try {
    const response = await rpcServer.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(response)) {
      const resultVal = response.result.retval;
      return scValToNative(resultVal);
    } else {
      const errorMsg = response.error || 'Simulation failed';
      throw new Error(errorMsg);
    }
  } catch (err) {
    console.error(`Simulation call failed for ${functionName} on contract ${contractInstance.contractId()}:`, err);
    throw err;
  }
}

/**
 * Simulates a call on the RentSplit contract.
 */
export async function simulateCall(functionName, args = []) {
  return simulateContractCall(rentContract, functionName, args);
}

/**
 * Simulates a call on the RoomManager contract.
 */
export async function simulateManagerCall(functionName, args = []) {
  return simulateContractCall(roomManagerContract, functionName, args);
}

/**
 * Fetches the total amount of rent collected globally in RentSplit.
 * 
 * @returns {Promise<number>} Total collected amount.
 */
export async function fetchTotalPaid() {
  try {
    const val = await simulateCall('get_total_paid');
    return Number(val);
  } catch (err) {
    console.error('Error fetching total paid:', err);
    throw err;
  }
}

/**
 * Fetches the global outstanding rent balance owed.
 * 
 * @param {string} roommateAddress The Stellar address to check.
 * @returns {Promise<number>} Global outstanding amount.
 */
export async function fetchBalanceOwed(roommateAddress) {
  if (!roommateAddress) return 0;
  try {
    const addrScVal = Address.fromString(roommateAddress).toScVal();
    const val = await simulateCall('get_balance', [addrScVal]);
    return Number(val);
  } catch (err) {
    console.error('Error fetching balance owed:', err);
    throw err;
  }
}

/**
 * Fetches a roommate's remaining individual rent share to pay.
 * 
 * @param {string} roommateAddress The roommate address.
 * @returns {Promise<number>} Roommate outstanding amount.
 */
export async function fetchRoommateBalance(roommateAddress) {
  if (!roommateAddress) return 0;
  try {
    const addrScVal = Address.fromString(roommateAddress).toScVal();
    const val = await simulateCall('get_roommate_balance', [addrScVal]);
    return Number(val);
  } catch (err) {
    console.error('Error fetching roommate balance:', err);
    throw err;
  }
}

/**
 * Fetches the registered rent share of a roommate from RoomManager.
 * 
 * @param {string} roommateAddress The roommate address.
 * @returns {Promise<number>} Roommate rent share.
 */
export async function fetchRoommateShare(roommateAddress) {
  if (!roommateAddress) return 0;
  try {
    const addrScVal = Address.fromString(roommateAddress).toScVal();
    const val = await simulateManagerCall('get_share', [addrScVal]);
    return Number(val);
  } catch (err) {
    console.error('Error fetching roommate share:', err);
    throw err;
  }
}

/**
 * Fetches the paid amount of a roommate from RoomManager.
 * 
 * @param {string} roommateAddress The roommate address.
 * @returns {Promise<number>} Roommate paid amount.
 */
export async function fetchRoommatePaid(roommateAddress) {
  if (!roommateAddress) return 0;
  try {
    const addrScVal = Address.fromString(roommateAddress).toScVal();
    const val = await simulateManagerCall('get_paid', [addrScVal]);
    return Number(val);
  } catch (err) {
    console.error('Error fetching roommate paid:', err);
    throw err;
  }
}

/**
 * Checks if an address is registered as a roommate in RoomManager.
 * 
 * @param {string} roommateAddress The roommate address.
 * @returns {Promise<boolean>} True if registered.
 */
export async function fetchIsRoommate(roommateAddress) {
  if (!roommateAddress) return false;
  try {
    const addrScVal = Address.fromString(roommateAddress).toScVal();
    return await simulateManagerCall('is_roommate', [addrScVal]);
  } catch (err) {
    console.error('Error checking is roommate:', err);
    throw err;
  }
}

/**
 * Fetches the total rent limit (sum of shares) from RoomManager.
 * 
 * @returns {Promise<number>} Total rent.
 */
export async function fetchTotalRent() {
  try {
    const val = await simulateManagerCall('get_total_rent');
    return Number(val);
  } catch (err) {
    console.error('Error fetching total rent:', err);
    throw err;
  }
}

/**
 * Fetches the registered landlord/admin address from RoomManager.
 * 
 * @returns {Promise<string|null>} Admin address.
 */
export async function fetchLandlord() {
  try {
    return await simulateManagerCall('get_admin');
  } catch (err) {
    console.error('Error fetching landlord address:', err);
    throw err;
  }
}

/**
 * Fetches the linked RentSplit contract address from RoomManager.
 * 
 * @returns {Promise<string|null>} Linked RentSplit contract address.
 */
export async function fetchRentSplitContractAddress() {
  try {
    return await simulateManagerCall('get_rent_split');
  } catch (err) {
    console.error('Error fetching rent split address:', err);
    throw err;
  }
}
