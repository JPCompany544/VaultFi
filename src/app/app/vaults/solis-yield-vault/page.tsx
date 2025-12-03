"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWalletContext, useShortAddress } from "@/context/WalletContext";
import { ArrowLeft, Info, ChevronDown, ExternalLink } from "lucide-react";
import VaultLiveChart from "@/components/VaultLiveChart";
import DepositAmountInput from "@/components/DepositAmountInput";
import VaultYieldDashboard from "@/components/VaultYieldDashboard";
import { useDepositContext } from "@/context/DepositContext";
import { solToUsd } from "@/utils/solToUsd";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getVaultBySlug } from "@/config/vaults";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { useVaultAvailableUSD } from "@/hooks/useVaultAvailableUSD";
import { useConnection } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";

const SOL_TREASURY_ADDRESS = "GojuogncNsE3SXX3BsZSuRXzYkVgapfnbFGjhqt1U8ic";



export default function FirstVaultPage() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [solPriceUSD, setSolPriceUSD] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStep, setDepositStep] = useState<'idle' | 'signing' | 'confirming' | 'calling-api' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Inline success should show only once per confirmed deposit
  const [showInlineSuccess, setShowInlineSuccess] = useState(false);
  const prevLatestRef = useRef<any>(undefined);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [lastHandledDepositId, setLastHandledDepositId] = useState<string | null>(null);

  const { wallet, openModal } = useWalletContext();
  const shortAddress = useShortAddress();
  const walletAddress = wallet?.address ?? null;
  const { connection } = useConnection();
  
  // Get vault config
  const vaultConfig = getVaultBySlug("solis-yield-vault");
  const vaultName = vaultConfig?.name || "Solis Yield Vault";
  const vaultAPY = vaultConfig?.apyNumeric || 8.1;
  const vaultTVL = vaultConfig?.tvl || "$123,456,789";
  const vaultAPYDisplay = vaultConfig?.apy || "8.1%";
  const { deposits, refreshDeposits, recordWithdrawal } = useDepositContext();
  const latestVaultDeposit = useMemo(
    () => deposits.find((deposit) => deposit.vaultName === vaultName),
    [deposits]
  );
  const currentStatus = latestVaultDeposit?.status ?? "idle";
  const isPendingStatus = currentStatus === "pending" || currentStatus === "pending_withdrawal";
  const isConfirmedStatus = currentStatus === "confirmed";
  const primaryActionLabel = activeTab === "withdraw" ? "Withdraw" : "Deposit";

  const { availableUSD } = useVaultAvailableUSD(walletAddress, vaultName);
  const { submit: submitWithdrawal, loading: withdrawing, error: withdrawalError } = useWithdrawal();


  
console.log("[latestVaultDeposit DEBUG]", latestVaultDeposit);





  const handleWithdraw = async () => {
    if (!walletAddress || !amount) {
      return;
    }
    // Enforce Solana-only Phantom wallet
    if (wallet.chainType !== 'solana') {
      toast.error("Please connect a Phantom (Solana) wallet to withdraw.");
      return;
    }
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
    const price = solPriceUSD;
    if (!price || !Number.isFinite(price) || price <= 0) {
      setErrorMessage("Live SOL price unavailable. Please try again.");
      setDepositStep('error');
      setIsDepositing(false);
      return;
    }
    const usdEquivalentCents = Math.round(parsedAmount * price * 100);
    const availableCents = Math.round(Math.max(0, availableUSD || 0) * 100);
    if (usdEquivalentCents > availableCents) {
      setErrorMessage("Amount exceeds your available balance.");
      setDepositStep('error');
      setIsDepositing(false);
      return;
    }
    const usdEquivalent = usdEquivalentCents / 100;
    const result = await submitWithdrawal({ wallet: walletAddress, vaultName, usdAmount: usdEquivalent });
    if (!result.ok) {
      setErrorMessage(withdrawalError || "Failed to submit withdrawal");
      setDepositStep('error');
      setIsDepositing(false);
      return;
    }
    // Optimistically update balance
    // recordWithdrawal(usdEquivalent);
    setDepositStep('idle');
    setIsDepositing(false);
    setAmount("");
    toast.success("Withdrawal request submitted successfully.");
    try { await refreshDeposits(); } catch {}
  };

  // Mirror DepositContext confirmation state locally for UI flags
  useEffect(() => {
    setConfirmed(isConfirmedStatus);
  }, [isConfirmedStatus]);

  useEffect(() => {
    if (!latestVaultDeposit || latestVaultDeposit.status !== "confirmed") return;

    const storageKey = `vaultfi:lastSeenConfirmation:solis-yield`;
    const lastSeenId =
      typeof window !== "undefined"
        ? localStorage.getItem(storageKey)
        : null;

    // If this confirmed deposit hasn't been shown before
    if (lastSeenId !== latestVaultDeposit.id) {
      setShowInlineSuccess(true);

      // Mark as shown so refresh won't show it again
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, latestVaultDeposit.id);
      }
    } else {
      // Already handled in the past → never show again
      setShowInlineSuccess(false);
    }
  }, [latestVaultDeposit]);

  const faqs = [
    {
      q: "What is the Solis Yield Vault and how does it work?",
      a: (
        <p>
          The Solis Yield Vault is a high-performance crypto vault designed to maximize SOL yield through secure, automated strategies. Deposits are pooled, allocated to vetted yield-generating protocols, and continuously optimized to deliver steady returns. Users maintain full ownership of their funds at all times while earning passive rewards.
        </p>
      ),
    },
    {
      q: "Which tokens can I deposit into the vault?",
      a: (
        <p>
          Currently, the Solis Yield Vault accepts SOL exclusively. This ensures optimized strategies for maximum yield and seamless performance tracking. All deposits are converted into yield-generating positions automatically within the vault.
        </p>
      ),
    },
    {
      q: "How can I track my vault performance in real time?",
      a: (
        <p>
          VaultFi provides a live dashboard showing your share of the vault, total value locked (TVL), and real-time yield growth. The Solis Vault dashboard updates continuously, reflecting accurate performance with realistic, steady growth patterns to help you make informed decisions.
        </p>
      ),
    },
    {
      q: "Are there any fees for depositing or withdrawing?",
      a: (
        <p>
          VaultFi maintains a transparent fee structure. Deposits and withdrawals are free of hidden charges, but a small performance fee may apply on the yield earned to sustain vault operations and strategy optimizations. All fees are clearly displayed before you confirm any transaction.
        </p>
      ),
    },
    {
      q: "Is my capital safe in the Solis Yield Vault?",
      a: (
        <p>
          Yes. Security is paramount. All funds are held in audited, on-chain smart contracts with automated treasury management. Vault strategies are designed to minimize risk while maximizing yield. Users retain full control over deposits, and withdrawals are executed in real time without delay.
        </p>
      ),
    },
  ];

  // Consolidated toast handler: only fire for newly confirmed deposits/withdrawals
  useEffect(() => {
    if (latestVaultDeposit === undefined || latestVaultDeposit === null) {
      prevLatestRef.current = latestVaultDeposit;
      return;
    }

    // hydration moment
    if (!hasHydrated) {
      setHasHydrated(true);
      prevLatestRef.current = latestVaultDeposit;
      return;
    }

    // post-hydration logic
    if (latestVaultDeposit.id !== lastHandledDepositId &&
        latestVaultDeposit.status === "confirmed") {
      toast.success("Deposit confirmed");  // use my actual toast
      setLastHandledDepositId(latestVaultDeposit.id);
    }

    prevLatestRef.current = latestVaultDeposit;
  }, [latestVaultDeposit]);

  // Phantom provider lifecycle listeners
  useEffect(() => {
    const anyWindow = typeof window !== "undefined" ? (window as any) : undefined;
    const provider = anyWindow?.solana;
    if (!provider || !provider.on) return;

    const handleConnect = () => {
      // Optional: could add lightweight side effects here if needed
    };
    const handleDisconnect = () => {
      // Optional: could add lightweight side effects here if needed
    };

    provider.on("connect", handleConnect);
    provider.on("disconnect", handleDisconnect);

    return () => {
      try {
        provider.off?.("connect", handleConnect);
        provider.off?.("disconnect", handleDisconnect);
      } catch {}
    };
  }, []);

  /**
   * Handles the deposit action when user clicks the Deposit button
   * Native SOL transfer via Phantom → treasury, then inserts a pending row into Supabase.
   */
  const handleDeposit = async (amountSOL: number) => {
    const anyWindow = typeof window !== "undefined" ? (window as any) : undefined;
    const provider = anyWindow?.solana;

    // Phantom Wallet Readiness Check
    if (!provider || !provider.isPhantom) {
      toast.error("Phantom wallet is not ready. Please install or reconnect.");
      return;
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet to deposit.");
      return;
    }

    // Enforce Solana-only Phantom wallet
    if (wallet.chainType !== "solana") {
      toast.error("Please connect a Phantom (Solana) wallet to deposit.");
      return;
    }

    if (!Number.isFinite(amountSOL) || amountSOL <= 0) {
      setErrorMessage("Invalid amount");
      setDepositStep("error");
      return;
    }

    const price = solPriceUSD;
    if (!price || !Number.isFinite(price) || price <= 0) {
      setErrorMessage("Live SOL price unavailable. Please try again.");
      setDepositStep("error");
      return;
    }

    const usdAmount = Number((amountSOL * price).toFixed(2));

    // Auto-connect Wallet if needed
    if (!provider.isConnected || !provider.publicKey) {
      try {
        await provider.connect();
      } catch {
        toast.error("User rejected wallet connection");
        return;
      }
    }

    setErrorMessage("");
    setIsDepositing(true);
    setDepositStep("signing");

    try {
      const fromPubkey = new web3.PublicKey(provider.publicKey.toBase58());
      const treasuryPubkey = new web3.PublicKey(SOL_TREASURY_ADDRESS);
      const lamports = Math.round(amountSOL * web3.LAMPORTS_PER_SOL);

      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey,
          toPubkey: treasuryPubkey,
          lamports,
        })
      );

      transaction.feePayer = fromPubkey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      let signature: string;
      try {
        const result = await provider.signAndSendTransaction(transaction);
        signature = typeof result === "string" ? result : result.signature;
      } catch (err) {
        console.error("Phantom transaction error", err);
        setDepositStep("error");
        toast.error("Transaction failed or something went wrong.");
        return;
      }

      setDepositStep("confirming");

      try {
        const confirmation = await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );
        if (confirmation.value?.err) {
          throw new Error("Transaction confirmation failed");
        }
      } catch (err) {
        console.error("Transaction confirmation error", err);
        setDepositStep("error");
        toast.error("Transaction failed or something went wrong.");
        return;
      }

      setDepositStep("calling-api");

      const { error: insertError } = await supabase
        .from("deposits")
        .insert({
          wallet: provider.publicKey.toBase58(),
          vault_name: vaultName,
          amount: amountSOL,
          amount_usd: usdAmount,
          tx_hash: signature,
          status: "confirmed",
          created_at: new Date().toISOString(),
          claimable_rewards: 0,
          apy: vaultAPY || 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error", insertError);
        setDepositStep("error");
        toast.error("Transaction failed or something went wrong.");
        return;
      }

      setDepositStep("idle");
      setAmount("");
      toast.success("Deposit submitted. Awaiting confirmation...");
    } catch (err) {
      console.error("Unexpected deposit error", err);
      setDepositStep("error");
      toast.error("Transaction failed or something went wrong.");
    } finally {
      setIsDepositing(false);
    }
  };

  // Solis Vault accepts only SOL deposits

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="bg-[#121212] border-b border-neutral-800 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-neutral-400 hover:text-white text-sm md:text-base"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} className="mr-1.5 md:mr-2" />
            <span className="hidden sm:inline">Back to Vaults</span>
            <span className="sm:hidden">Back</span>
          </Button>
          {!wallet.address ? (
            <Button
              onClick={openModal}
              className="bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 active:bg-[#7C5CFC]/80 text-white font-semibold px-4 py-2 rounded-xl text-sm md:text-base transition-all duration-200 shadow-lg hover:shadow-[#7C5CFC]/25"
            >
              Connect Wallet
            </Button>
          ) : (
            <WalletConnectButton />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Top Section */}
        <div className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 md:gap-6">
            {/* Left Side */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
                  {vaultName}
                </h1>
                
                {/* TVL and APY Row */}
                <div className="flex items-center gap-5 md:gap-8">
                  <div>
                    <p className="text-xs md:text-sm text-neutral-400 mb-1">Vault TVL</p>
                    <p className="text-lg md:text-2xl font-bold text-white">{vaultTVL}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div>
                        <p className="text-xs md:text-sm text-neutral-400 mb-1">APY</p>
                        <p className="text-lg md:text-2xl font-bold text-white">{vaultAPYDisplay}</p>
                      </div>
                      
                      {/* Info Icon with Tooltip */}
                      <div 
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <Info 
                          size={18} 
                          className="text-neutral-400 hover:text-white cursor-help transition-colors" 
                        />
                        
                        {/* Tooltip */}
                        {showTooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800/95 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-lg z-10 w-56 md:min-w-max">
                            <p className="text-xs md:text-sm text-white">
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
            {/* Banner image - hidden on mobile */}
            <div className="hidden lg:flex vault-banner-right lg:w-auto lg:ml-auto items-center justify-end lg:pr-[5px]">
              <img
                alt="Solis Banner Logo"
                src="/solis-defi/Solv-banner-logo.png"
                className="vault-banner-logo shadow-lg opacity-80"
                width={180}
                height={120}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Deposit/Withdraw Section */}
          <div className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-8">
            {/* Tabs Row */}
            <div className="flex border-b border-neutral-700 mb-6 md:mb-8">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 md:flex-none md:px-6 py-3 md:py-4 font-medium text-sm md:text-base transition-all duration-200 ${
                  activeTab === "deposit"
                    ? "text-white border-b-2 border-[#7C5CFC]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 md:flex-none md:px-6 py-3 md:py-4 font-medium text-sm md:text-base transition-all duration-200 ${
                  activeTab === "withdraw"
                    ? "text-white border-b-2 border-[#7C5CFC]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Withdraw
              </button>
            </div>

            {/* Form Section */}
            <div className="w-full md:max-w-md md:mx-auto">
              <DepositAmountInput value={amount} onChange={setAmount} onPriceChangeAction={setSolPriceUSD} />
              {activeTab === "withdraw" && (
                <div className="mt-2 text-[10px] md:text-xs text-neutral-400" aria-live="polite">
                  Available to withdraw: ${availableUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              )}
              
              {/* Dynamic Connect/Deposit Button */}
              {!wallet.address ? (
                // Show "Connect Wallet" when wallet is not connected
                <Button
                  onClick={openModal}
                  className="w-full mt-6 md:mt-8 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 active:bg-[#7C5CFC]/80 text-white font-semibold py-3.5 md:py-4 rounded-lg md:rounded-xl text-base md:text-lg transition-all duration-200 shadow-lg hover:shadow-[#7C5CFC]/25 touch-manipulation"
                >
                  Connect Wallet
                </Button>
              ) : (
                // Show different states based on deposit progress
                <div className="space-y-3 md:space-y-4">
                  <Button
                    onClick={
                      activeTab === "withdraw"
                        ? handleWithdraw
                        : () => {
                            const parsed = parseFloat(amount);
                            void handleDeposit(parsed);
                          }
                    }
                    disabled={
                      isDepositing ||
                      withdrawing ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      isPendingStatus
                    }
                    className="w-full mt-6 md:mt-8 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 active:bg-[#7C5CFC]/80 text-white font-semibold py-3.5 md:py-4 rounded-lg md:rounded-xl text-base md:text-lg transition-all duration-200 shadow-lg hover:shadow-[#7C5CFC]/25 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {primaryActionLabel}
                  </Button>

                  {/* Status Messages */}
                  {isPendingStatus && (
                    <div className="text-center space-y-2">
                      <div className="text-green-400 text-sm" aria-live="polite">
                        {currentStatus === "pending_withdrawal" ? "Withdrawal submitted, awaiting confirmation…" : "Deposit submitted, awaiting confirmation…"}
                      </div>
                      <div className="text-yellow-400 text-xs">
                        Status: Pending admin confirmation
                      </div>
                    </div>
                  )}

                  {showInlineSuccess && (
                    <div className="text-center space-y-2">
                      <div className="text-green-400 text-sm font-medium">
                        Deposit confirmed!
                      </div>
                      <div className="text-neutral-400 text-xs">
                        Portfolio updated automatically.
                      </div>
                    </div>
                  )}

                  {depositStep === "error" && errorMessage && (
                    <div className="text-center text-red-400 text-sm">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* About the Vault Section */}
          <div className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg">
            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-white mb-5 md:mb-6" style={{ fontFamily: 'Faculty-Glyphic' }}>
              About the Vault
            </h2>

            {/* Tab Navigation Row */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-5 md:mb-6">
              {[
                { id: "details", label: "Details" },
                { id: "goals", label: "Goals" },
                { id: "strategies", label: "Strategies" },
                { id: "risks", label: "Risks" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInfoTab(tab.id)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 touch-manipulation ${
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
            <div className="border-t border-neutral-700 mb-5 md:mb-6"></div>

            {/* Content Section */}
            <div className="space-y-3 md:space-y-4">
              {activeInfoTab === "details" && (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs md:text-sm text-neutral-400">Strategy provider</span>
                    <span className="text-xs md:text-sm text-white text-right">Seven Seas Capital & Lombard</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs md:text-sm text-neutral-400">Platform fee</span>
                    <span className="text-xs md:text-sm text-white">1%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs md:text-sm text-neutral-400">Performance fee</span>
                    <span className="text-xs md:text-sm text-white">0%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs md:text-sm text-neutral-400">Exit fee</span>
                    <span className="text-xs md:text-sm text-white">1%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs md:text-sm text-neutral-400">Contract link</span>
                    <a 
                      href="#" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs md:text-sm text-[#7C5CFC] hover:text-[#7C5CFC]/80 hover:underline transition-colors flex items-center gap-1 touch-manipulation"
                    >
                      Etherscan
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </>
              )}

              {activeInfoTab === "goals" && (
                <div className="text-xs md:text-sm text-white leading-relaxed">
                  <p className="mb-3 md:mb-4">
                    Solis Yield Vault, developed in partnership with Veda, is an automated yield management solution designed to maximize BTC-denominated returns by strategically deploying deposits across various products within the DeFi ecosystem.
                  </p>
                  <p>
                    The Solis yield DeFi Vault is cross-chain. This means that yield earned on all chains is distributed proportionally across all users, independent of which chain they deposited from.
                  </p>
                </div>
              )}

              {activeInfoTab === "strategies" && (
                <div className="text-xs md:text-sm text-white leading-relaxed">
                  <p>
                    The Vault's strategies include providing liquidity on DEX platforms like Uniswap (tight price ranges) and Curve, lending on platforms such as Gearbox and Morpho Blue, and engaging in yield trading on Pendle. Additionally, the Vault facilitates automated compounding by efficiently converting all accrued DeFi rewards into LBTC.
                  </p>
                </div>
              )}

              {activeInfoTab === "risks" && (
                <div className="text-xs md:text-sm text-white leading-relaxed">
                  <p>
                    The Vault represents a basket of DeFi products containing smart contract risk and varying degrees of economic risk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Chart Section */}
        <div className="mt-6 md:mt-8">
          <VaultLiveChart />
        </div>

        <div className="mt-6 md:mt-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-5" style={{ fontFamily: 'Faculty-Glyphic' }}>
            Your Live Yield
          </h2>
          <VaultYieldDashboard />
        </div>

        <div className="mt-6 md:mt-8">
          <div className="bg-[#1A1A1A] rounded-xl md:rounded-2xl p-5 md:p-8">
            <h2 className="text-lg md:text-xl font-bold text-white mb-5 md:mb-6" style={{ fontFamily: 'Faculty-Glyphic' }}>
              FAQs
            </h2>
            <div className="divide-y divide-neutral-700">
              {faqs.map((item, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between py-3 md:py-4 text-left gap-3"
                  >
                    <span className="text-sm md:text-base text-white font-medium">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-neutral-400 transition-transform flex-shrink-0 ${openFaq === idx ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="pb-3 md:pb-4 text-xs md:text-sm text-neutral-300">
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
