import React from 'react';
import { ExternalLink, Activity, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { getExplorerContractUrl, getExplorerTxUrl, CONTRACT_ID, ROOM_MANAGER_CONTRACT_ID } from '../constants/network';
import { formatAddress } from '../utils/format';

export function ProofOfUsageView({ events = [] }) {
  return (
    <div className="bg-slate-900/90 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-appBorder/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold font-heading text-white">Public Proof of Usage Feed</h2>
          </div>
          <p className="text-xs text-appText-muted">
            Live Stellar Testnet transaction history & contract events. Viewable by anyone without wallet authorization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExplorerContractUrl(CONTRACT_ID)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-accent flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-accent" /> RentSplit Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Contract Architecture Metadata Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-appBorder/50 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Payment Processor Contract</span>
          <div className="font-mono text-white text-[11px] truncate">{CONTRACT_ID}</div>
          <a
            href={getExplorerContractUrl(CONTRACT_ID)}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-accent hover:underline inline-flex items-center gap-1 pt-0.5"
          >
            View on Stellar Expert <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        <div className="bg-slate-950/60 border border-appBorder/50 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Room Registry Contract</span>
          <div className="font-mono text-white text-[11px] truncate">{ROOM_MANAGER_CONTRACT_ID}</div>
          <a
            href={getExplorerContractUrl(ROOM_MANAGER_CONTRACT_ID)}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-accent hover:underline inline-flex items-center gap-1 pt-0.5"
          >
            View on Stellar Expert <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Events Table / Card Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified On-Chain Events ({events.length})</h3>
        
        {events.length === 0 ? (
          <div className="bg-slate-950/40 border border-dashed border-appBorder/60 rounded-xl p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No rent settlement events recorded yet on Testnet.</p>
            <p className="text-[11px] text-slate-500">Connect a wallet or start Demo Mode to submit transactions!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {events.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="bg-slate-950/60 border border-appBorder/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Payer: {formatAddress(evt.payer || evt.roommate)}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        +{evt.amount} XLM
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Event: <code className="text-accent">{evt.type || 'pay_rent'}</code></span>
                      <span>•</span>
                      <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                {evt.txHash && (
                  <a
                    href={getExplorerTxUrl(evt.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
                  >
                    Hash: {formatAddress(evt.txHash, 4, 4)} <ExternalLink className="w-3 h-3 text-accent" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProofOfUsageView;
