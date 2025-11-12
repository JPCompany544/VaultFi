"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWalletContext, useShortAddress } from "@/context/WalletContext";
import { ArrowLeft, Info, ChevronDown, ArrowRight, ExternalLink } from "lucide-react";
import VaultLiveChart from "@/components/VaultLiveChart";
import { useDepositContext } from "@/context/DepositContext";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getVaultBySlug } from "@/config/vaults";

export default function FirstVaultPage() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStep, setDepositStep] = useState<'idle' | 'signing' | 'confirming' | 'calling-api' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const previousStatus = useRef<string | null>(null);

  const { wallet, openModal } = useWalletContext();
  const shortAddress = useShortAddress();
  const walletAddress = wallet?.address ?? null;
  
  // Get vault config
  const vaultConfig = getVaultBySlug("vaultfi-prime-vault");
  const vaultName = vaultConfig?.name || "VaultFi Prime Vault";
  const vaultAPY = vaultConfig?.apyNumeric || 3.1;
  const vaultTVL = vaultConfig?.tvl || "$102,749,385";
  const vaultAPYDisplay = vaultConfig?.apy || "3.1%";
  const { deposits, insertDeposit } = useDepositContext();
  const latestVaultDeposit = useMemo(
    () => deposits.find((deposit) => deposit.vaultName === vaultName),
    [deposits]
  );
  const currentStatus = latestVaultDeposit?.status ?? "idle";
  const isPendingStatus = currentStatus === "pending";
  const isConfirmedStatus = currentStatus === "confirmed";

  // Add realtime listener for wallet deposits
  useEffect(() => {
    if (!walletAddress) return;

    const channel = supabase
      .channel(`deposits-${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deposits',
          filter: `wallet=eq.${walletAddress}`,
        },
        (payload) => {
          const newDeposit = payload.new as any;
          if (newDeposit && newDeposit.status === 'confirmed' && newDeposit.vault_name === vaultName) {
            setConfirmed(true);
            // Portfolio sync: refresh via context
            // Assuming DepositContext refreshes automatically, or call refreshDeposits here if needed
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress]);

  // Auto-reset deposit state fix
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => {
        setConfirmed(false);
        setAmount("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmed]);

  const faqs = [
    {
      q: "What is Lombard Defi Vault?",
      a: (
        <p>
          Lombard DeFi Vault is a Bitcoin Vault token that lets you earn Bitcoin-based returns by participating in Binance Launchpools and BNB Chain DeFi protocols. By holding Bitcoin, you can unlock yield opportunities while maintaining exposure to Bitcoin.
        </p>
      ),
    },
    {
      q: "How do I earn yields with Lombard Defi Vault?",
      a: (
        <div className="space-y-3">
          <p>
            You can earn yields by holding Bitcoin in the Lombard DeFi Vault or deploying it in supported BNB Chain DeFi protocols. Yields come from:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Binance Launchpool, HODL-er & Megadrop Rewards</li>
            <li>DeFi Yields</li>
            <li>Solv Season 3 Points</li>
          </ul>
        </div>
      ),
    },
    {
      q: "How are rewards distributed?",
      a: (
        <div className="space-y-3">
          <p>
            Rewards are reflected in the Net Asset Value (NAV) of your BTC holdings. Additional airdrop rewards are distributed based on daily snapshots of your Bitcoins balance, either held in the Vault or deployed in supported DeFi protocols. To qualify:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hold BTC in the Lombard Defi Vault protocol.</li>
            <li>Activate the Vault System on the platform to track and claim rewards.</li>
          </ul>
          <p>
            <em>
              Note: A 25% performance fee is applied to yields, with 5% of this fee allocated to an insurance fund to support periods without active Binance Launchpools.
            </em>
          </p>
        </div>
      ),
    },
    {
      q: "What are the risks of holding Bitcoin in Lombard Defi Vault?",
      a: (
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Smart Contract Risk: Security depends on the Solv Protocol and underlying DeFi platforms (e.g., Venus), which are audited but not risk-free.
          </li>
          <li>
            Economic Risk: Yields may vary, especially during periods without active Binance Launchpools. The insurance fund helps mitigate this but doesn’t eliminate it.
          </li>
          <li>
            Market Risk: The value of the DeFi Vault is highly correlated to Bitcoin’s price.
          </li>
        </ul>
      ),
    },
    {
      q: "How do redemptions work for Lombard Defi Vault?",
      a: (
        <div className="space-y-3">
          <p>
            To redeem your yirlded BTC inside the vauly, submit a redemption request via the platform. Requests are processed three times a month:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Requests submitted from the 1st to the 9th → Processed on the 20th</li>
            <li>Requests submitted from the 10th to the 19th → Processed on the last day of the month</li>
            <li>Requests submitted from the 20th to the end of the month → Processed on the 10th of the following month</li>
          </ul>
          <p>🔹 If a processing date falls on a weekend, it will be deferred to the next business day.</p>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const previous = previousStatus.current;
    if (previous !== "confirmed" && isConfirmedStatus) {
      setToastMessage("Deposit confirmed successfully!");
      setAmount("");
    }
    previousStatus.current = currentStatus;
  }, [currentStatus, isConfirmedStatus]);

  useEffect(() => {
    if (isPendingStatus) {
      setToastMessage("Transaction pending...");
    }
  }, [isPendingStatus]);

  useEffect(() => {
    if (isConfirmedStatus) {
      setToastMessage("Transaction confirmed!");
    }
  }, [isConfirmedStatus]);

  // Auto-hide toast after timeout if user closes it early
  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  /**
   * Handles the deposit action when user clicks the Deposit button
   * Inserts directly to Supabase with status "pending"
   */
  const handleDeposit = async () => {
    if (!walletAddress || !amount) {
      console.warn("Cannot deposit: wallet not connected or amount not specified");
      return;
    }

    // Reset error state
    setErrorMessage("");
    setIsDepositing(true);
    setDepositStep('calling-api');

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Invalid amount");
      setDepositStep('error');
      setIsDepositing(false);
      return;
    }

    const { error } = await insertDeposit({
      wallet: walletAddress,
      vaultName: vaultName,
      amount: parsedAmount,
      txHash: null,
      apy: vaultAPY,
      claimable_rewards: 0,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to submit deposit");
      setDepositStep('error');
      setIsDepositing(false);
      return;
    }

    setDepositStep('idle');
    setIsDepositing(false);
    toast.success("Deposit submitted, awaiting confirmation…");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="bg-[#121212] border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-neutral-400 hover:text-white"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Vaults
          </Button>
          
          <WalletConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Top Section */}
        <div className="bg-[#1A1A1A] rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side */}
            <div className="flex items-center gap-6">
              <img 
                src="/tinified/institutions-logo.svg" 
                alt="Institution" 
                className="w-16 h-16" 
              />
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  {vaultName}
                </h1>
                
                {/* TVL and APY Row */}
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Vault TVL</p>
                    <p className="text-2xl font-bold text-white">{vaultTVL}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm text-neutral-400 mb-1">APY</p>
                        <p className="text-2xl font-bold text-white">{vaultAPYDisplay}</p>
                      </div>
                      
                      {/* Info Icon with Tooltip */}
                      <div 
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <Info 
                          size={20} 
                          className="text-neutral-400 hover:text-white cursor-help transition-colors" 
                        />
                        
                        {/* Tooltip */}
                        {showTooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800/95 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-lg z-10 min-w-max">
                            <p className="text-sm text-white whitespace-nowrap">
                              Projected APY based on returns expected over the next 14 days.
                            </p>
                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit/Withdraw Section */}
          <div className="bg-[#1A1A1A] rounded-2xl p-8">
            {/* Tabs Row */}
            <div className="flex border-b border-neutral-700 mb-8">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === "deposit"
                    ? "text-white border-b-2 border-[#7C5CFC]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === "withdraw"
                    ? "text-white border-b-2 border-[#7C5CFC]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Withdraw
              </button>
            </div>

            {/* Form Section */}
            <div className="max-w-md mx-auto">
              {/* Amount Label */}
              <label className="block text-sm font-medium text-white mb-3">
                Amount
              </label>

              {/* Input Field */}
              <div className="relative bg-[#1a1a1a] rounded-xl border border-neutral-700 p-4 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  {/* Amount Input */}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-white placeholder-neutral-500 text-lg font-medium focus:outline-none"
                  />

                  {/* Right Side Controls */}
                  <div className="flex items-center gap-2">
                    {/* MAX Button */}
                    <button className="px-3 py-1 bg-[#7C5CFC] text-white text-xs font-medium rounded-lg hover:bg-[#7C5CFC]/90 transition-colors">
                      MAX
                    </button>

                    {/* Token Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="appearance-none bg-transparent text-white font-medium pr-6 focus:outline-none cursor-pointer"
                      >
                        <option value="BTC" className="bg-[#1a1a1a]">BTC</option>
                        <option value="BNB" className="bg-[#1a1a1a]">BNB</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>

                    {/* Arrow Icon */}
                    <ArrowRight size={16} className="text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* Dynamic Connect/Deposit Button */}
              {!wallet.address ? (
                // Show "Connect Wallet" when wallet is not connected
                <Button
                  onClick={openModal}
                  className="w-full mt-8 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-semibold py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-[#7C5CFC]/25"
                >
                  Connect Wallet
                </Button>
              ) : (
                // Show different states based on deposit progress
                <div className="space-y-4">
                  <Button
                    onClick={handleDeposit}
                    disabled={
                      isDepositing ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      isPendingStatus ||
                      confirmed
                    }
                    className="w-full mt-8 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-semibold py-4 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-[#7C5CFC]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {depositStep === 'calling-api' && "Processing Deposit..."}
                    {isPendingStatus && "Deposit Submitted (Pending Confirmation)"}
                    {confirmed && "✅ Deposit Confirmed"}
                    {depositStep === 'error' && "❌ Try Again"}
                    {depositStep === 'idle' && !isPendingStatus && !confirmed && "Deposit"}
                  </Button>
                  
                  {/* Status Messages */}
                  {isPendingStatus && (
                    <div className="text-center space-y-2">
                      <div className="text-green-400 text-sm">
                        Deposit submitted, awaiting confirmation…
                      </div>
                      <div className="text-yellow-400 text-xs">
                        Status: Pending admin confirmation
                      </div>
                    </div>
                  )}

                  {confirmed && (
                    <div className="text-center space-y-2">
                      <div className="text-green-400 text-sm font-medium">
                        ✅ Deposit confirmed!
                      </div>
                      <div className="text-neutral-400 text-xs">
                        Portfolio updated automatically.
                      </div>
                    </div>
                  )}
                  
                  {depositStep === 'error' && errorMessage && (
                    <div className="text-center text-red-400 text-sm">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About the Vault Section */}
          <div className="bg-[#1A1A1A] rounded-2xl p-8 shadow-lg">
            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Faculty-Glyphic' }}>
              About the Vault
            </h2>

            {/* Tab Navigation Row */}
            <div className="flex gap-2 mb-6">
              {[
                { id: "details", label: "Details" },
                { id: "goals", label: "Goals" },
                { id: "strategies", label: "Strategies" },
                { id: "risks", label: "Risks" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInfoTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeInfoTab === tab.id
                      ? "bg-neutral-600 text-white shadow-sm"
                      : "bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Divider Line */}
            <div className="border-t border-neutral-700 mb-6"></div>

            {/* Content Section */}
            <div className="space-y-4">
              {activeInfoTab === "details" && (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-400">Strategy provider</span>
                    <span className="text-sm text-white">Seven Seas Capital & Lombard</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-400">Platform fee</span>
                    <span className="text-sm text-white">0% Until further notice</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-400">Performance fee</span>
                    <span className="text-sm text-white">0%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-400">Exit fee</span>
                    <span className="text-sm text-white">0%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-neutral-400">Contract link</span>
                    <a 
                      href="#" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#7C5CFC] hover:text-[#7C5CFC]/80 hover:underline transition-colors flex items-center gap-1"
                    >
                      Etherscan
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </>
              )}

              {activeInfoTab === "goals" && (
                <div className="text-sm text-white leading-relaxed">
                  <p className="mb-4">
                    Lombard's Vault, developed in partnership with Veda, is an automated yield management solution designed to maximize BTC-denominated returns by strategically deploying deposits across various products within the DeFi ecosystem.
                  </p>
                  <p>
                    The Lombard DeFi Vault is cross-chain. This means that yield earned on all chains is distributed proportionally across all users, independent of which chain they deposited from.
                  </p>
                </div>
              )}

              {activeInfoTab === "strategies" && (
                <div className="text-sm text-white leading-relaxed">
                  <p>
                    The Vault's strategies include providing liquidity on DEX platforms like Uniswap (tight price ranges) and Curve, lending on platforms such as Gearbox and Morpho Blue, and engaging in yield trading on Pendle. Additionally, the Vault facilitates automated compounding by efficiently converting all accrued DeFi rewards into LBTC.
                  </p>
                </div>
              )}

              {activeInfoTab === "risks" && (
                <div className="text-sm text-white leading-relaxed">
                  <p>
                    The Vault represents a basket of DeFi products containing smart contract risk and varying degrees of economic risk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Chart Section */}
        <div className="mt-8">
          <VaultLiveChart />
        </div>

        <div className="mt-8">
          <div className="bg-[#1A1A1A] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Faculty-Glyphic' }}>
              FAQs
            </h2>
            <div className="divide-y divide-neutral-700">
              {faqs.map((item, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-white font-medium">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-neutral-400 transition-transform ${openFaq === idx ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="pb-4 text-sm text-neutral-300">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {toastMessage && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-200 shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
