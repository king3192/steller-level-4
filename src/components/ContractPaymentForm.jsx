import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ShieldCheck, Info, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { formatXLM } from '../utils/format';
import { 
  fetchBalanceOwed, 
  fetchTotalPaid, 
  fetchIsRoommate, 
  fetchRoommateShare, 
  fetchRoommatePaid, 
  fetchRoommateBalance 
} from '../utils/contract';

export function ContractPaymentForm({
  senderAddress,
  walletBalance,
  onSubmit,
  isLoading,
  isMock,
}) {
  const [amount, setAmount] = useState('');
  const [contractTotalPaid, setContractTotalPaid] = useState(null);
  const [contractBalanceOwed, setContractBalanceOwed] = useState(null);
  
  // Roommate-specific states
  const [isRoommate, setIsRoommate] = useState(null); // null represents loading
  const [roommateShare, setRoommateShare] = useState(0);
  const [roommatePaid, setRoommatePaid] = useState(0);
  const [roommateBalance, setRoommateBalance] = useState(0);

  const [loadingContractState, setLoadingContractState] = useState(false);
  const [contractError, setContractError] = useState(null);

  // Validations
  const [error, setError] = useState(null);
  const [isTouched, setIsTouched] = useState(false);

  // Global total rent calculated from collected + remaining owed
  const totalRent = (contractTotalPaid || 0) + (contractBalanceOwed || 0);

  const loadContractData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingContractState(true);
    setContractError(null);

    if (isMock) {
      // Setup realistic mock roommate values
      // If the address contains 'GA7R' or similar, we mock it as roommate
      setContractTotalPaid(650);
      setContractBalanceOwed(350);
      setIsRoommate(true);
      setRoommateShare(300);
      setRoommatePaid(120);
      setRoommateBalance(180);
      if (showLoading) setLoadingContractState(false);
      return;
    }

    try {
      const [
        paid, 
        owed, 
        registered, 
        share, 
        rmPaid, 
        rmBalance
      ] = await Promise.all([
        fetchTotalPaid(),
        fetchBalanceOwed(senderAddress),
        fetchIsRoommate(senderAddress),
        fetchRoommateShare(senderAddress),
        fetchRoommatePaid(senderAddress),
        fetchRoommateBalance(senderAddress)
      ]);

      setContractTotalPaid(paid);
      setContractBalanceOwed(owed);
      setIsRoommate(registered);
      setRoommateShare(share);
      setRoommatePaid(rmPaid);
      setRoommateBalance(rmBalance);
    } catch (err) {
      console.error('Failed to load contract state:', err);
      setContractError('Could not sync contract state. Make sure contracts are compiled, deployed, and linked.');
    } finally {
      if (showLoading) setLoadingContractState(false);
    }
  }, [isMock, senderAddress]);

  // Load contract balances on mount or when address changes
  useEffect(() => {
    loadContractData(true);
  }, [loadContractData]);

  // Run validation whenever inputs change
  const validate = useCallback(() => {
    if (!isTouched) {
      setError(null);
      return;
    }

    if (!isRoommate) {
      setError('You are not registered as a roommate.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount) {
      setError('Amount is required.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    // Account for wallet reserve (1 XLM reserve)
    const maxSpendableWallet = Math.max(0, parseFloat(walletBalance || 0) - 1);
    if (parsedAmount > maxSpendableWallet) {
      setError(`Amount exceeds your spendable wallet balance (${formatXLM(maxSpendableWallet)} XLM, reserving 1 XLM for fees).`);
      return;
    }

    // Check against individual remaining roommate balance
    if (roommateBalance !== null && parsedAmount > roommateBalance) {
      setError(`Amount exceeds your outstanding rent share (${roommateBalance} XLM remaining).`);
      return;
    }

    // Check against global remaining rent split balance
    if (contractBalanceOwed !== null && parsedAmount > contractBalanceOwed) {
      setError(`Amount exceeds global rent owed on the contract (${contractBalanceOwed} XLM remaining).`);
      return;
    }

    setError(null);
  }, [amount, walletBalance, isRoommate, roommateBalance, contractBalanceOwed, isTouched]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleMaxClick = () => {
    setIsTouched(true);
    const maxSpendableWallet = Math.max(0, parseFloat(walletBalance || 0) - 1);
    const maxAllowed = roommateBalance !== null 
      ? Math.min(maxSpendableWallet, roommateBalance) 
      : maxSpendableWallet;

    setAmount(maxAllowed > 0 ? maxAllowed.toString() : '0');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsTouched(true);

    if (!isRoommate) {
      setError('Cannot submit. Address is not registered as a roommate.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (roommateBalance !== null && parsedAmount > roommateBalance) {
      setError('Amount exceeds your remaining individual rent share.');
      return;
    }

    if (!error) {
      onSubmit({ amount: parsedAmount });
    }
  };

  const isFormValid = 
    amount && 
    !error && 
    isRoommate &&
    roommateBalance > 0 && 
    parseFloat(amount) <= roommateBalance;

  const roommatePercentPaid = roommateShare > 0 ? Math.round((roommatePaid / roommateShare) * 100) : 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-5"
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Smart Contract Rent Settlement
        </h3>
        
        <button
          type="button"
          onClick={() => loadContractData(true)}
          disabled={loadingContractState || isLoading}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-appText-muted hover:text-white transition-colors"
          title="Refresh Contract Stats"
        >
          <RefreshCw className={`w-4 h-4 ${loadingContractState ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Access Control Check alerts */}
      {isRoommate === false && !loadingContractState && (
        <div className="bg-error/10 border border-error/25 rounded-xl p-4 text-xs text-error space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-error mt-0.5" />
            <div>
              <span className="font-bold">Not Registered as Roommate</span>
              <p className="text-appText-muted mt-0.5 leading-normal">
                Your wallet address is not registered in the roommate registry. Landlords must register you in the RoomManager contract before you can split rent.
              </p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-appBorder/50 space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wide">Your Address:</span>
            <span className="font-mono text-slate-200 block break-all text-[11px]">{senderAddress}</span>
          </div>
        </div>
      )}

      {/* Roommate Stats Metrics Dashboard */}
      {isRoommate && (
        <div className="space-y-3.5 bg-slate-950/60 border border-appBorder rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Your Personal Rent Overview</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center border-b border-appBorder/40 pb-3">
            <div>
              <span className="text-[9px] text-appText-muted font-medium uppercase tracking-wider">Your Share</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {loadingContractState ? '...' : `${roommateShare} XLM`}
              </p>
            </div>
            <div className="border-x border-appBorder/40">
              <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">You Paid</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {loadingContractState ? '...' : `${roommatePaid} XLM`}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-amber-400 font-medium uppercase tracking-wider">You Owe</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {loadingContractState ? '...' : `${roommateBalance} XLM`}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-appText-muted font-medium">
              <span>Your Contribution Settlement</span>
              <span className="text-white font-semibold">{roommatePercentPaid}% Paid</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-appBorder/20">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${roommatePercentPaid}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Contract Stats overview */}
      <div className="flex justify-between items-center text-xs bg-slate-950/30 border border-appBorder/40 px-3.5 py-2.5 rounded-xl">
        <span className="text-appText-muted">Global Pool Metrics:</span>
        <span className="font-semibold text-slate-300">
          {loadingContractState ? '...' : `${contractTotalPaid} / ${totalRent} XLM Paid`}
        </span>
      </div>

      {contractError && (
        <div className="bg-error/10 border border-error/25 rounded-xl p-3 text-xs text-error flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{contractError}</span>
        </div>
      )}

      {/* Roommate Rent Fully Settled Alert */}
      {isRoommate && roommateBalance === 0 && !loadingContractState && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-3.5 text-xs text-success flex items-start gap-2.5">
          <Info className="w-4.5 h-4.5 shrink-0 text-success mt-0.5" />
          <div>
            <span className="font-bold">Your Share is Fully Settled!</span>
            <p className="text-appText-muted mt-0.5 leading-normal">
              Congratulations! You have paid 100% of your assigned rent share. Thank you!
            </p>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="contractAmount" className="text-xs font-semibold text-appText-muted">
            Your Rent Contribution (XLM)
          </label>
          <button
            type="button"
            onClick={handleMaxClick}
            disabled={isLoading || loadingContractState || !isRoommate || roommateBalance <= 0}
            className="text-xs font-bold text-accent hover:text-accent/90 disabled:opacity-50 disabled:cursor-not-allowed hover:underline focus:outline-none"
          >
            Pay Max Owed
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            id="contractAmount"
            step="any"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setIsTouched(true);
            }}
            disabled={isLoading || loadingContractState || !isRoommate || roommateBalance <= 0}
            placeholder="0.00"
            className={`w-full pl-4 pr-16 py-2.5 bg-slate-950/75 border rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all duration-200 ${
              error && isTouched
                ? 'border-error/55 focus:ring-error/25'
                : 'border-appBorder'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-appText-muted">
            XLM
          </span>
        </div>
        {error && isTouched ? (
          <span className="text-xs text-error font-medium flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </span>
        ) : (
          <p className="text-[10px] text-appText-muted">
            * Invoking a Soroban smart contract will securely authorize and record your payment on the Testnet ledger.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || loadingContractState || !isFormValid}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          isLoading || loadingContractState || !isFormValid
            ? 'bg-primary/50 text-white/75 cursor-not-allowed border border-primary/10'
            : 'bg-primary hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] text-white border border-primary/20 shadow-lg shadow-primary/20 glow-pulse'
        }`}
        aria-label="Pay rent via contract call"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Invoking Soroban Contract...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Pay Rent on Contract</span>
          </>
        )}
      </button>
    </form>
  );
}

ContractPaymentForm.propTypes = {
  senderAddress: PropTypes.string.isRequired,
  walletBalance: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isMock: PropTypes.bool,
};

ContractPaymentForm.defaultProps = {
  walletBalance: '0.0000000',
  isMock: false,
};

export default ContractPaymentForm;
