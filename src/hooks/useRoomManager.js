import { useState, useCallback } from 'react';
import { 
  rpc, 
  Address, 
  nativeToScVal, 
  TransactionBuilder, 
  TimeoutInfinite 
} from '@stellar/stellar-sdk';
import { rpcServer, roomManagerContract } from '../utils/contract';
import { server as horizonServer } from '../utils/stellar';
import { NETWORK_PASSPHRASE } from '../constants/network';
import { classifyError } from '../utils/errors';

/**
 * Custom React hook to interact with the RoomManager contract (admin actions).
 * Tracks state transitions: idle | building | awaiting_signature | submitting | pending | success | error.
 * 
 * @param {Function} signTransaction The signTransaction function from useWalletKit.
 * @returns {Object} { addRoommate, setRentSplit, status, result, error, reset }
 */
export function useRoomManager(signTransaction) {
  const [status, setStatus] = useState('idle'); // idle | building | awaiting_signature | submitting | pending | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  const addRoommate = useCallback(async ({ adminAddress, roommateAddress, share, isMock }) => {
    setStatus('building');
    setError(null);
    setResult(null);

    try {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus('awaiting_signature');
        await signTransaction(null); // mock signing delay
        setStatus('submitting');
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus('pending');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setStatus('success');
        setResult({
          hash: mockHash,
          roommate: roommateAddress,
          share,
          isMock: true,
          action: 'add_roommate',
        });
        return;
      }

      // 1. Load account
      let sourceAccount;
      try {
        sourceAccount = await horizonServer.loadAccount(adminAddress);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          throw new Error("Landlord account hasn't been funded yet on Testnet.");
        }
        throw err;
      }

      // 2. Fetch base fee
      let baseFee = '100';
      try {
        const feeStats = await horizonServer.feeStats();
        baseFee = feeStats.fee_charged?.max || '100';
      } catch (err) {
        console.error('Failed feeStats fallback to 100:', err);
      }

      // 3. Build Transaction (add_roommate)
      const roommateScVal = Address.fromString(roommateAddress).toScVal();
      const shareScVal = nativeToScVal(share, { type: 'i128' });

      const tx = new TransactionBuilder(sourceAccount, {
        fee: baseFee,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(roomManagerContract.call('add_roommate', roommateScVal, shareScVal))
        .setTimeout(TimeoutInfinite)
        .build();

      // 4. Simulate
      const simulationResponse = await rpcServer.simulateTransaction(tx);
      if (!rpc.Api.isSimulationSuccess(simulationResponse)) {
        throw new Error(simulationResponse.error || 'Add Roommate transaction simulation failed.');
      }

      // 5. Assemble
      const assembledTx = rpc.assembleTransaction(tx, simulationResponse);

      // 6. Sign
      setStatus('awaiting_signature');
      const txXdr = assembledTx.toXDR();
      let signedXdr;
      try {
        signedXdr = await signTransaction(txXdr);
      } catch (err) {
        throw new Error(err.message || 'Signature rejected.');
      }

      // 7. Submit
      setStatus('submitting');
      const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResponse = await rpcServer.sendTransaction(signedTransaction);

      if (sendResponse.status === 'ERROR') {
        throw new Error(sendResponse.errorResultXdr || 'Transaction submission error.');
      }

      const txHash = sendResponse.hash;
      setStatus('pending');

      // 8. Poll
      let txStatus = sendResponse.status;
      let getTxResponse = null;

      while (txStatus === 'PENDING' || txStatus === 'NOT_FOUND') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        getTxResponse = await rpcServer.getTransaction(txHash);
        txStatus = getTxResponse.status;

        if (txStatus === 'SUCCESS') {
          break;
        } else if (txStatus === 'FAILED') {
          throw new Error('Transaction execution failed on ledger.');
        }
      }

      setStatus('success');
      setResult({
        hash: txHash,
        roommate: roommateAddress,
        share,
        action: 'add_roommate',
      });

    } catch (err) {
      console.error('Add roommate error:', err);
      setStatus('error');
      const classified = classifyError(err);
      setError(classified.message);
    }
  }, [signTransaction]);

  const setRentSplit = useCallback(async ({ adminAddress, rentSplitAddress, isMock }) => {
    setStatus('building');
    setError(null);
    setResult(null);

    try {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus('awaiting_signature');
        await signTransaction(null);
        setStatus('submitting');
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus('pending');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setStatus('success');
        setResult({
          hash: mockHash,
          rentSplit: rentSplitAddress,
          isMock: true,
          action: 'set_rent_split',
        });
        return;
      }

      // 1. Load account
      let sourceAccount = await horizonServer.loadAccount(adminAddress);

      // 2. Fetch base fee
      let baseFee = '100';
      try {
        const feeStats = await horizonServer.feeStats();
        baseFee = feeStats.fee_charged?.max || '100';
      } catch (err) {}

      // 3. Build Transaction (set_rent_split)
      const splitScVal = Address.fromString(rentSplitAddress).toScVal();
      const tx = new TransactionBuilder(sourceAccount, {
        fee: baseFee,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(roomManagerContract.call('set_rent_split', splitScVal))
        .setTimeout(TimeoutInfinite)
        .build();

      // 4. Simulate
      const simulationResponse = await rpcServer.simulateTransaction(tx);
      if (!rpc.Api.isSimulationSuccess(simulationResponse)) {
        throw new Error(simulationResponse.error || 'Set Rent Split simulation failed.');
      }

      // 5. Assemble
      const assembledTx = rpc.assembleTransaction(tx, simulationResponse);

      // 6. Sign
      setStatus('awaiting_signature');
      const txXdr = assembledTx.toXDR();
      let signedXdr = await signTransaction(txXdr);

      // 7. Submit
      setStatus('submitting');
      const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResponse = await rpcServer.sendTransaction(signedTransaction);

      if (sendResponse.status === 'ERROR') {
        throw new Error(sendResponse.errorResultXdr || 'Transaction submission error.');
      }

      const txHash = sendResponse.hash;
      setStatus('pending');

      // 8. Poll
      let txStatus = sendResponse.status;
      let getTxResponse = null;

      while (txStatus === 'PENDING' || txStatus === 'NOT_FOUND') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        getTxResponse = await rpcServer.getTransaction(txHash);
        txStatus = getTxResponse.status;

        if (txStatus === 'SUCCESS') {
          break;
        } else if (txStatus === 'FAILED') {
          throw new Error('Transaction execution failed on ledger.');
        }
      }

      setStatus('success');
      setResult({
        hash: txHash,
        rentSplit: rentSplitAddress,
        action: 'set_rent_split',
      });

    } catch (err) {
      console.error('Set Rent Split error:', err);
      setStatus('error');
      const classified = classifyError(err);
      setError(classified.message);
    }
  }, [signTransaction]);

  return {
    addRoommate,
    setRentSplit,
    status,
    result,
    error,
    reset,
  };
}

export default useRoomManager;
