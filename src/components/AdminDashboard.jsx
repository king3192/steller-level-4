import { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Users, 
  UserPlus, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { shortenAddress, formatXLM } from '../utils/format';

export function AdminDashboard({
  adminAddress,
  roommates,
  totalRent,
  totalPaid,
  linkedSplitAddress,
  onAddRoommate,
  onSetRentSplit,
  isLoading,
  actionStatus,
  actionError,
  actionResult,
  onResetStatus,
}) {
  const [roommateAddress, setRoommateAddress] = useState('');
  const [rentShare, setRentShare] = useState('');
  const [splitAddress, setSplitAddress] = useState(linkedSplitAddress || '');
  
  // Validation states
  const [roommateError, setRoommateError] = useState('');
  const [shareError, setShareError] = useState('');
  const [splitError, setSplitError] = useState('');

  const handleAddRoommateSubmit = (e) => {
    e.preventDefault();
    setRoommateError('');
    setShareError('');

    // Validate address
    if (!roommateAddress) {
      setRoommateError('Roommate address is required.');
      return;
    }
    if (!/^G[A-D2-7][A-Z2-7]{54}$/.test(roommateAddress)) {
      setRoommateError('Invalid Stellar public key format.');
      return;
    }

    // Validate share
    const shareNum = parseFloat(rentShare);
    if (!rentShare || isNaN(shareNum) || shareNum <= 0) {
      setShareError('Share must be a positive number.');
      return;
    }

    onAddRoommate({ roommateAddress, share: shareNum });
  };

  const handleSetSplitSubmit = (e) => {
    e.preventDefault();
    setSplitError('');

    if (!splitAddress) {
      setSplitError('RentSplit contract address is required.');
      return;
    }
    if (!/^C[A-D2-7][A-Z2-7]{54}$/.test(splitAddress)) {
      setSplitError('Invalid Soroban contract address format (must start with C).');
      return;
    }

    onSetRentSplit({ rentSplitAddress: splitAddress });
  };

  const percentCollected = totalRent > 0 ? Math.round((totalPaid / totalRent) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Landlord Header Overview */}
      <div className="bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-bold font-heading text-white">Landlord Dashboard</h3>
            </div>
            <p className="text-xs text-appText-muted">
              Owner: <span className="font-mono text-slate-300">{shortenAddress(adminAddress)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 border border-appBorder/50 rounded-xl px-4 py-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-right md:text-left">
              <span className="text-[10px] text-appText-muted block uppercase tracking-wider">Total Pool Rent</span>
              <span className="text-sm font-bold text-white">{totalRent} XLM ({percentCollected}% Settled)</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-appText-muted">
            <span>Global Settlement Progress</span>
            <span className="text-emerald-400">{totalPaid} / {totalRent} XLM</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-appBorder/40">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, percentCollected)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transaction status notifications */}
      {actionStatus !== 'idle' && actionStatus !== 'building' && (
        <div className="bg-slate-900/90 border border-appBorder/85 rounded-xl p-4 space-y-3 shadow-md">
          <div className="flex items-start gap-2.5">
            {actionStatus === 'awaiting_signature' && (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-accent mt-0.5" />
            )}
            {actionStatus === 'submitting' && (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-primary mt-0.5" />
            )}
            {actionStatus === 'pending' && (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-amber-400 mt-0.5" />
            )}
            {actionStatus === 'success' && (
              <CheckCircle className="w-4.5 h-4.5 text-success mt-0.5" />
            )}
            {actionStatus === 'error' && (
              <AlertCircle className="w-4.5 h-4.5 text-error mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-white">
                {actionStatus === 'awaiting_signature' && 'Awaiting Wallet Signature...'}
                {actionStatus === 'submitting' && 'Submitting to Network...'}
                {actionStatus === 'pending' && 'Confirming on Stellar Ledger...'}
                {actionStatus === 'success' && 'Transaction Confirmed!'}
                {actionStatus === 'error' && 'Transaction Failed'}
              </h4>
              <p className="text-appText-muted mt-1 leading-normal">
                {actionStatus === 'awaiting_signature' && 'Please open your connected wallet utility and authorize the Soroban contract call.'}
                {actionStatus === 'submitting' && 'Sending XDR payload to Stellar Horizon/Soroban RPC gateways...'}
                {actionStatus === 'pending' && 'Waiting for ledger close confirmation (approx. 3-5 seconds).'}
                {actionStatus === 'success' && (
                  <>
                    Successfully executed: <span className="font-semibold text-white">{actionResult?.action === 'add_roommate' ? 'Add Roommate' : 'Link RentSplit Contract'}</span>. 
                    {actionResult?.hash && (
                      <span className="block mt-1 break-all font-mono text-[10px]">Tx Hash: {actionResult.hash}</span>
                    )}
                  </>
                )}
                {actionStatus === 'error' && actionError}
              </p>
            </div>
          </div>
          {(actionStatus === 'success' || actionStatus === 'error') && (
            <button
              onClick={onResetStatus}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Main Admin Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Roommate List Dashboard */}
        <div className="bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
            <Users className="w-4.5 h-4.5 text-accent" />
            Registered Roommates ({roommates.length})
          </h4>

          {roommates.length === 0 ? (
            <div className="text-center py-6 bg-slate-950/40 border border-appBorder/50 border-dashed rounded-xl space-y-1">
              <p className="text-xs text-appText-muted">No roommates registered yet.</p>
              <p className="text-[10px] text-slate-500">Use the registration form below to add them to this contract.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {roommates.map((rm) => {
                const ratio = rm.share > 0 ? rm.paid / rm.share : 0;
                const percent = Math.min(100, Math.round(ratio * 100));
                
                return (
                  <div 
                    key={rm.address}
                    className="bg-slate-950/50 border border-appBorder/60 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono font-semibold text-slate-200 block">
                          {shortenAddress(rm.address)}
                        </span>
                        {rm.address === adminAddress && (
                          <span className="text-[9px] bg-accent/20 text-accent font-bold px-1.5 py-0.2 rounded">
                            Landlord
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          percent >= 100 
                            ? 'bg-success/20 text-success' 
                            : percent > 0 
                            ? 'bg-amber-400/20 text-amber-300' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {percent >= 100 ? 'Fully Paid' : percent > 0 ? 'Partial' : 'Unpaid'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-appText-muted font-medium">
                        <span>Rent Settled</span>
                        <span className="text-white font-semibold">
                          {rm.paid} / {rm.share} XLM ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-appBorder/20">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent >= 100 ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Roommate Form */}
        <div className="bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
            <UserPlus className="w-4.5 h-4.5 text-accent" />
            Register New Roommate
          </h4>

          <form onSubmit={handleAddRoommateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="roommateAddress" className="text-xs font-semibold text-appText-muted">
                Roommate Stellar Public Key (Address)
              </label>
              <input
                type="text"
                id="roommateAddress"
                value={roommateAddress}
                onChange={(e) => {
                  setRoommateAddress(e.target.value);
                  setRoommateError('');
                }}
                disabled={isLoading}
                placeholder="G..."
                className={`w-full px-4 py-2.5 bg-slate-950/75 border rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all duration-200 ${
                  roommateError ? 'border-error/55 focus:ring-error/25' : 'border-appBorder'
                }`}
              />
              {roommateError && (
                <span className="text-[11px] text-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {roommateError}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="rentShare" className="text-xs font-semibold text-appText-muted">
                Assigned Rent Share (XLM)
              </label>
              <input
                type="number"
                id="rentShare"
                value={rentShare}
                onChange={(e) => {
                  setRentShare(e.target.value);
                  setShareError('');
                }}
                disabled={isLoading}
                placeholder="e.g. 500"
                className={`w-full px-4 py-2.5 bg-slate-950/75 border rounded-xl text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all duration-200 ${
                  shareError ? 'border-error/55 focus:ring-error/25' : 'border-appBorder'
                }`}
              />
              {shareError && (
                <span className="text-[11px] text-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {shareError}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || actionStatus === 'awaiting_signature' || actionStatus === 'submitting' || actionStatus === 'pending'}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl text-xs transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Submitting to Ledger...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Roommate & Share</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link Split Contract Configuration */}
        <div className="bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
            <Layers className="w-4.5 h-4.5 text-accent" />
            Link Split Settlement Contract
          </h4>
          <p className="text-[11px] text-appText-muted leading-relaxed">
            The `RoomManager` registry needs the authorized `RentSplit` contract address linked so payments made on the split contract can successfully write roommate balances.
          </p>

          <form onSubmit={handleSetSplitSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="splitAddress" className="text-xs font-semibold text-appText-muted">
                RentSplit Contract ID
              </label>
              <input
                type="text"
                id="splitAddress"
                value={splitAddress}
                onChange={(e) => {
                  setSplitAddress(e.target.value);
                  setSplitError('');
                }}
                disabled={isLoading}
                placeholder="C..."
                className={`w-full px-4 py-2.5 bg-slate-950/75 border rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all duration-200 ${
                  splitError ? 'border-error/55 focus:ring-error/25' : 'border-appBorder'
                }`}
              />
              {splitError && (
                <span className="text-[11px] text-error font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {splitError}
                </span>
              )}
            </div>

            {linkedSplitAddress && (
              <div className="text-[10px] bg-slate-950/50 border border-appBorder/50 rounded-lg p-2.5 space-y-0.5">
                <span className="text-slate-400 block font-medium">Currently Linked:</span>
                <span className="font-mono text-slate-200 block break-all">{linkedSplitAddress}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || actionStatus === 'awaiting_signature' || actionStatus === 'submitting' || actionStatus === 'pending'}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-[0.98] border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting to Ledger...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Link Split Contract</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

AdminDashboard.propTypes = {
  adminAddress: PropTypes.string.isRequired,
  roommates: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      share: PropTypes.number.isRequired,
      paid: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalRent: PropTypes.number.isRequired,
  totalPaid: PropTypes.number.isRequired,
  linkedSplitAddress: PropTypes.string,
  onAddRoommate: PropTypes.func.isRequired,
  onSetRentSplit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  actionStatus: PropTypes.string.isRequired,
  actionError: PropTypes.string,
  actionResult: PropTypes.object,
  onResetStatus: PropTypes.func.isRequired,
};

AdminDashboard.defaultProps = {
  linkedSplitAddress: '',
  actionError: null,
  actionResult: null,
};

export default AdminDashboard;
