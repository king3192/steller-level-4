import { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/Header';
import { WalletPanel } from './components/WalletPanel';
import { PaymentForm } from './components/PaymentForm';
import { ContractPaymentForm } from './components/ContractPaymentForm';
import { AdminDashboard } from './components/AdminDashboard';
import { TransactionStatus } from './components/TransactionStatus';
import { RecentActivity } from './components/RecentActivity';
import { FundingHelper } from './components/FundingHelper';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingModal } from './components/OnboardingModal';
import { ProofOfUsageView } from './components/ProofOfUsageView';
import { FeedbackModal } from './components/FeedbackModal';
import { useWalletKit } from './hooks/useWalletKit';
import { useBalance } from './hooks/useBalance';
import { useSendPayment } from './hooks/useSendPayment';
import { usePayRent } from './hooks/usePayRent';
import { useRoomManager } from './hooks/useRoomManager';
import { useContractEvents } from './hooks/useContractEvents';
import { 
  fetchLandlord, 
  fetchTotalRent, 
  fetchTotalPaid, 
  fetchRentSplitContractAddress,
} from './utils/contract';
import { trackEvent, ANALYTICS_EVENTS } from './utils/analytics';
import { ShieldAlert, Sparkles, Coins, Zap, Layers, Send, UserCheck, Shield, Activity } from 'lucide-react';

const MOCK_LANDLORD = 'GDLANDLORDADMINISTRATOR111111111111111111111111111111';
const MOCK_ROOMMATE_1 = 'GA7R2U6L26QG3NDXQ4Q6XCY36PZXZVUNH2QLJ34KYY3LMXJ2P3JNZQLS';

export function App() {
  const [paymentMode, setPaymentMode] = useState('contract'); // 'direct', 'contract', 'admin', 'proof'
  const [landlordAddress, setLandlordAddress] = useState(null);
  const [totalRent, setTotalRent] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [linkedSplitAddress, setLinkedSplitAddress] = useState('');
  
  // Roommates registry state
  const [roommates, setRoommates] = useState([]);
  
  // Custom mock profile toggle for testing roles in Demo Mode
  const [mockRole, setMockRole] = useState('roommate'); // 'landlord' or 'roommate'

  // Modals & Notifications
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [toast, setToast] = useState({ type: 'info', message: null });

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const closeToast = () => {
    setToast({ type: 'info', message: null });
  };

  const {
    publicKey: kitPublicKey,
    isConnected,
    isConnecting,
    isMock,
    walletType,
    connectWallet,
    connectMockWallet,
    disconnectWallet,
    signTransaction,
    error: walletError,
  } = useWalletKit();

  // Dynamically resolve active public key based on mock role selected
  const publicKey = isMock 
    ? (mockRole === 'landlord' ? MOCK_LANDLORD : MOCK_ROOMMATE_1) 
    : kitPublicKey;

  const {
    balance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance(publicKey, isMock);

  // Hook for Native XLM Payments (Level 1)
  const {
    sendPayment,
    status: directStatus,
    result: directResult,
    error: directError,
    reset: resetDirectPayment,
  } = useSendPayment(signTransaction);

  // Hook for Soroban Contract Payments (Level 2)
  const {
    payRent,
    status: contractStatus,
    result: contractResult,
    error: contractError,
    reset: resetContractPayment,
  } = usePayRent(signTransaction);

  // Hook for RoomManager operations (Admin)
  const {
    addRoommate,
    setRentSplit,
    status: adminStatus,
    result: adminResult,
    error: adminError,
    reset: resetAdminStatus,
  } = useRoomManager(signTransaction);

  // Hook for Smart Contract Events (Real-time activity)
  const {
    events: contractEvents,
    refetch: refetchEvents,
    addMockEvent,
  } = useContractEvents(isMock);

  // Track initial onboarding status and wallet connections
  useEffect(() => {
    const hasVisited = localStorage.getItem('rentstar_has_visited');
    if (!hasVisited) {
      setIsOnboardingOpen(true);
      localStorage.setItem('rentstar_has_visited', 'true');
    }
  }, []);

  useEffect(() => {
    if (isConnected && publicKey) {
      trackEvent(ANALYTICS_EVENTS.WALLET_CONNECTED, {
        walletType: isMock ? 'mock' : walletType,
        isMock,
      });
      showToast('success', `Connected: ${walletType || 'Stellar'} wallet initialized.`);
    }
  }, [isConnected, publicKey, isMock, walletType]);

  // Load contract parameters: Landlord, Linked Split, Total Rent, Total Paid, Roommates
  const loadContractStats = useCallback(async () => {
    if (isMock) {
      setLandlordAddress(MOCK_LANDLORD);
      setLinkedSplitAddress('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
      setTotalRent(1200);
      setTotalPaid(770);
      
      // Default mock roommates list
      const savedRoommates = localStorage.getItem('rentstar_mock_roommates');
      if (savedRoommates) {
        setRoommates(JSON.parse(savedRoommates));
      } else {
        const initial = [
          { address: MOCK_ROOMMATE_1, share: 300, paid: 120 },
          { address: 'GCNQW65B5Y3F5547U243XGNYLMX26PA63OEXQ243XJY426PA63OEXQ63', share: 400, paid: 400 },
          { address: 'GAT3K26OEXQ243XJY426PA63OEXQ243XJY426PA63OEXQ243XJY426', share: 500, paid: 250 },
        ];
        setRoommates(initial);
        localStorage.setItem('rentstar_mock_roommates', JSON.stringify(initial));
      }
      return;
    }

    try {
      const [landlord, rentSum, collected, split] = await Promise.all([
        fetchLandlord(),
        fetchTotalRent(),
        fetchTotalPaid(),
        fetchRentSplitContractAddress()
      ]);

      setLandlordAddress(landlord);
      setTotalRent(rentSum);
      setTotalPaid(collected);
      setLinkedSplitAddress(split || '');

      // Load roommates list from local storage cache for on-chain
      const cached = localStorage.getItem(`roommates_${landlord}`);
      if (cached) {
        setRoommates(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Failed to load global contract settings:', err);
    }
  }, [isMock]);

  useEffect(() => {
    if (isConnected) {
      loadContractStats();
    }
  }, [isConnected, loadContractStats]);

  // Reset payment states when wallet is disconnected
  const handleDisconnect = () => {
    resetDirectPayment();
    resetContractPayment();
    resetAdminStatus();
    disconnectWallet();
    showToast('info', 'Wallet disconnected.');
  };

  const handlePaymentSubmit = async ({ recipientAddress, amount, memo }) => {
    if (!publicKey) return;
    await sendPayment({
      senderAddress: publicKey,
      recipientAddress,
      amount,
      memo,
      isMock,
    });
    refetchBalance();
  };

  const handleContractPaymentSubmit = async ({ amount }) => {
    if (!publicKey) return;
    await payRent({
      payerAddress: publicKey,
      amount,
      isMock,
    });

    refetchBalance();
    trackEvent(ANALYTICS_EVENTS.RENT_PAID, { amount, isMock });
    
    if (isMock) {
      // Simulate state updates inside state simulator
      const updated = roommates.map((rm) => {
        if (rm.address === publicKey) {
          return { ...rm, paid: rm.paid + amount };
        }
        return rm;
      });
      setRoommates(updated);
      localStorage.setItem('rentstar_mock_roommates', JSON.stringify(updated));
      setTotalPaid((prev) => prev + amount);
      addMockEvent(publicKey, amount);
    } else {
      refetchEvents();
      loadContractStats();
    }
  };

  const handleAddRoommate = async ({ roommateAddress, share }) => {
    await addRoommate({
      adminAddress: publicKey,
      roommateAddress,
      share,
      isMock,
    });

    trackEvent(ANALYTICS_EVENTS.ROOMMATE_REGISTERED, { share, isMock });

    if (isMock) {
      // Append roommate to mock state
      const newRoommate = { address: roommateAddress, share, paid: 0 };
      const updated = [...roommates, newRoommate];
      setRoommates(updated);
      localStorage.setItem('rentstar_mock_roommates', JSON.stringify(updated));
      setTotalRent((prev) => prev + share);
    } else {
      // Add roommate address cache for blockchain
      const updated = [...roommates, { address: roommateAddress, share, paid: 0 }];
      setRoommates(updated);
      localStorage.setItem(`roommates_${landlordAddress}`, JSON.stringify(updated));
      loadContractStats();
    }
  };

  const handleSetRentSplit = async ({ rentSplitAddress }) => {
    await setRentSplit({
      adminAddress: publicKey,
      rentSplitAddress,
      isMock,
    });

    if (isMock) {
      setLinkedSplitAddress(rentSplitAddress);
    } else {
      loadContractStats();
    }
  };

  const handleActiveTxReset = () => {
    if (paymentMode === 'direct') resetDirectPayment();
    else if (paymentMode === 'contract') resetContractPayment();
  };

  const handleFundingSuccess = () => {
    refetchBalance();
    showToast('success', 'Received 10,000 Testnet XLM from Friendbot!');
  };

  // Determine connected role
  const isLandlord = landlordAddress && publicKey === landlordAddress;

  // Active transaction status binder
  const activeTxStatus = paymentMode === 'direct' ? directStatus : contractStatus;
  const activeTxResult = paymentMode === 'direct' ? directResult : contractResult;
  const activeTxError = paymentMode === 'direct' ? directError : contractError;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-50 star-grid relative">
        {/* Network Connectivity Offline Banner */}
        <OfflineBanner />

        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div>
          <Header
            publicKey={publicKey}
            isConnecting={isConnecting}
            isMock={isMock}
            walletType={walletType}
            connectWallet={connectWallet}
            disconnectWallet={handleDisconnect}
            walletError={walletError}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
          />

          <main className="max-w-md mx-auto px-4 py-8 w-full z-10 relative space-y-6">
            {!isConnected ? (
              /* Disconnected Landing Page */
              <div className="bg-slate-900/80 border border-appBorder backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6 text-center animate-fade-in">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent fill-accent/15" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-white leading-tight">
                      Settle Rent on Stellar
                    </h1>
                    <p className="text-xs text-appText-muted leading-relaxed">
                      RentStar is a roommate settlement dApp. Connect your wallet to pay roommate shares via on-chain smart contracts or manage roommate registries.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-slate-950/45 border border-appBorder/50 rounded-xl p-3 flex flex-col justify-between space-y-1">
                    <Coins className="w-5 h-5 text-accent" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">Multi-Wallet</h4>
                      <p className="text-[10px] text-appText-muted mt-0.5 leading-normal">
                        Freighter, xBull, and Albedo supported.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-950/45 border border-appBorder/50 rounded-xl p-3 flex flex-col justify-between space-y-1">
                    <Zap className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-heading">Cross-Contract</h4>
                      <p className="text-[10px] text-appText-muted mt-0.5 leading-normal">
                        Inter-contract lookup registry settlement.
                      </p>
                    </div>
                  </div>
                </div>

                {walletError && (
                  <div className="bg-error/10 border border-error/25 rounded-xl p-3 text-xs text-error flex items-start gap-2 text-left animate-fade-in">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Connection issue:</span>{' '}
                      <span>{walletError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-primary/20 glow-pulse active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Connect Stellar Wallet"
                  >
                    {isConnecting ? 'Opening Wallet Modal...' : 'Connect Stellar Wallet'}
                  </button>
                  <button
                    onClick={connectMockWallet}
                    disabled={isConnecting}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-xs transition-all duration-300 border border-slate-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Connect Demo Wallet"
                  >
                    Connect Demo Wallet (Mock Mode)
                  </button>
                </div>

                {/* Public Proof of Usage Entry Link */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setPaymentMode('proof')}
                    className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <Activity className="w-3.5 h-3.5" /> View Public On-Chain Activity Feed
                  </button>
                </div>
              </div>
            ) : (
              /* Connected App Panel */
              <div className="space-y-6">
                <WalletPanel
                  publicKey={publicKey}
                  balance={balance}
                  isLoading={isBalanceLoading}
                  balanceError={balanceError}
                  walletType={walletType}
                  refetchBalance={refetchBalance}
                  fundingHelperNode={
                    <FundingHelper
                      publicKey={publicKey}
                      onFundingSuccess={handleFundingSuccess}
                    />
                  }
                />

                {/* Demo Mode Interactive Role Selector */}
                {isMock && (
                  <div className="bg-slate-900/90 border border-appBorder border-dashed rounded-xl p-3 flex items-center justify-between shadow-inner animate-fade-in">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-accent" />
                      <span className="text-xs font-semibold text-slate-300">Simulate Profile:</span>
                    </div>
                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-appBorder/50">
                      <button
                        onClick={() => {
                          setMockRole('roommate');
                          setPaymentMode('contract');
                        }}
                        className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
                          mockRole === 'roommate' 
                            ? 'bg-accent text-slate-950' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Roommate
                      </button>
                      <button
                        onClick={() => {
                          setMockRole('landlord');
                          setPaymentMode('admin');
                        }}
                        className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
                          mockRole === 'landlord' 
                            ? 'bg-accent text-slate-950' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Landlord (Admin)
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Selector Toggle */}
                {activeTxStatus === 'idle' && (
                  <div className="flex bg-slate-900/90 border border-appBorder/85 rounded-xl p-1 w-full shadow-inner animate-fade-in">
                    {isLandlord && (
                      <button
                        onClick={() => setPaymentMode('admin')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-350 ${
                          paymentMode === 'admin'
                            ? 'bg-primary text-white shadow-md shadow-primary/10'
                            : 'text-appText-muted hover:text-white'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Landlord
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setPaymentMode('contract');
                        resetContractPayment();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-350 ${
                        paymentMode === 'contract'
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'text-appText-muted hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Rent Split
                    </button>
                    
                    <button
                      onClick={() => {
                        setPaymentMode('direct');
                        resetDirectPayment();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-350 ${
                        paymentMode === 'direct'
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'text-appText-muted hover:text-white'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Direct XLM
                    </button>

                    <button
                      onClick={() => setPaymentMode('proof')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-350 ${
                        paymentMode === 'proof'
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'text-appText-muted hover:text-white'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Activity
                    </button>
                  </div>
                )}

                {/* Action views based on toggle mode */}
                {paymentMode === 'proof' ? (
                  <ProofOfUsageView events={contractEvents} />
                ) : paymentMode === 'admin' && isLandlord ? (
                  <AdminDashboard
                    adminAddress={publicKey}
                    roommates={roommates}
                    totalRent={totalRent}
                    totalPaid={totalPaid}
                    linkedSplitAddress={linkedSplitAddress}
                    onAddRoommate={handleAddRoommate}
                    onSetRentSplit={handleSetRentSplit}
                    isLoading={adminStatus === 'building' || adminStatus === 'submitting' || adminStatus === 'pending'}
                    actionStatus={adminStatus}
                    actionError={adminError}
                    actionResult={adminResult}
                    onResetStatus={resetAdminStatus}
                  />
                ) : activeTxStatus !== 'idle' ? (
                  <TransactionStatus
                    status={activeTxStatus}
                    result={activeTxResult}
                    error={activeTxError}
                    onReset={handleActiveTxReset}
                  />
                ) : paymentMode === 'direct' ? (
                  <PaymentForm
                    senderAddress={publicKey}
                    balance={balance}
                    onSubmit={handlePaymentSubmit}
                    isLoading={directStatus !== 'idle'}
                  />
                ) : (
                  <ContractPaymentForm
                    senderAddress={publicKey}
                    walletBalance={balance}
                    onSubmit={handleContractPaymentSubmit}
                    isLoading={contractStatus !== 'idle'}
                    isMock={isMock}
                  />
                )}

                {/* Real-time event activities */}
                {paymentMode !== 'proof' && <RecentActivity events={contractEvents} />}
              </div>
            )}

            {/* If disconnected and public proof mode selected */}
            {!isConnected && paymentMode === 'proof' && (
              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMode('contract')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  ← Back to Home
                </button>
                <ProofOfUsageView events={contractEvents} />
              </div>
            )}
          </main>
        </div>

        <Footer />

        {/* Floating Modals & Toast System */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onStartDemo={connectMockWallet}
          onConnectWallet={connectWallet}
        />

        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onShowToast={showToast}
        />

        <Toast
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
        />

        {/* Vercel Web Analytics */}
        <Analytics />
      </div>
    </ErrorBoundary>
  );
}

export default App;
