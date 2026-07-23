import React, { useState } from 'react';
import { Sparkles, Wallet, Coins, PlayCircle, ChevronRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';
import { trackEvent, ANALYTICS_EVENTS } from '../utils/analytics';

export function OnboardingModal({ isOpen, onClose, onStartDemo, onConnectWallet }) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onClose();
  };

  const handleTryDemo = () => {
    trackEvent(ANALYTICS_EVENTS.DEMO_MODE_STARTED, { source: 'onboarding' });
    onStartDemo();
    onClose();
  };

  const handleConnect = () => {
    onConnectWallet();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-350 ${
                s === step
                  ? 'bg-accent shadow-sm shadow-accent/50'
                  : s < step
                  ? 'bg-primary'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-accent">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-heading text-white">Welcome to RentStar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RentStar is an enterprise rent settlement dApp powered by Stellar Soroban smart contracts.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <CheckCircle2 className="w-4 h-4" /> Multi-Contract Rent Pools
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Landlords register roommate allocations in <code className="text-accent font-mono">RoomManager</code>, while <code className="text-accent font-mono">RentSplit</code> validates payments on-chain via cross-contract calls.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-heading text-white">1. Get a Stellar Wallet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                To sign transactions on Stellar Testnet, install a wallet extension such as <strong className="text-white">Freighter</strong>, <strong className="text-white">xBull</strong>, or <strong className="text-white">Albedo</strong>.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-white">Recommended: Freighter Wallet</div>
              <p className="text-[11px] text-slate-400">
                Download from <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="text-accent underline">freighter.app</a> and switch network settings to <strong className="text-white">Testnet</strong>.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
              <Coins className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-heading text-white">2. Fund Your Testnet Wallet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                New Testnet accounts require initial XLM funding to activate on the Stellar ledger.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-emerald-400">Built-in Friendbot Helper</div>
              <p className="text-[11px] text-slate-400">
                RentStar includes a 1-click Friendbot helper button on the dashboard to request 10,000 free Testnet XLM directly to your public address.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
              <PlayCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-heading text-white">3. Ready to Explore!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your real browser wallet or test all features instantly using Demo Mode (Profile Simulator).
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleConnect}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-primary/20"
              >
                Connect Stellar Wallet
              </button>
              <button
                onClick={handleTryDemo}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs border border-slate-700 transition-all"
              >
                Try Demo Mode (Instant Mock)
              </button>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps && (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
