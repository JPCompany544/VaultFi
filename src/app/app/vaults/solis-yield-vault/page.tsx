"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useWalletContext, useShortAddress } from "@/context/WalletContext";
import { useDepositContext } from "@/context/DepositContext";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { useVaultAvailableUSD } from "@/hooks/useVaultAvailableUSD";
import * as web3 from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import { getVaultBySlug } from "@/config/vaults";
import DepositAmountInput from "@/components/DepositAmountInput";
import TreasuryActivityStream from "@/components/TreasuryActivityStream";
import toast from "react-hot-toast";

// Public Solana RPC connection for fetching blockhashes and sending transactions
// Using publicnode because api.mainnet-beta.solana.com blocks frontend CORS requests with 403
const PUBLIC_SOLANA_RPC = "https://solana-rpc.publicnode.com";
function getConnection() { return new web3.Connection(PUBLIC_SOLANA_RPC, "confirmed"); }

const SOL_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_SOL_TREASURY_ADDRESS || "3dUdf8boyak3DUcU992UvNtM8n5RTzpQqX35DUtmUCCR";

export default function SolisOperationalTerminal() {
  // Inputs & Actions state
  const [amount, setAmount] = useState("");
  const [exitAmount, setExitAmount] = useState("");
  const [solPriceUSD, setSolPriceUSD] = useState<number | null>(null);

  // Poll live index price
  useEffect(() => {
    let active = true;
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/solPrice");
        const data = await res.json();
        if (active && data.success && data.price > 0) {
          setSolPriceUSD(data.price);
        }
      } catch (e) {
        console.error("Failed to fetch live index price:", e);
      }
    };
    void fetchPrice();
    const interval = setInterval(fetchPrice, 15000); // Poll every 15s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Allocation terminal step
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStep, setDepositStep] = useState<'idle' | 'signing' | 'confirming' | 'calling-api' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showInlineSuccess, setShowInlineSuccess] = useState(false);

  // Liquidity exit panel step
  const [isExiting, setIsExiting] = useState(false);
  const [exitStep, setExitStep] = useState<'idle' | 'calling-api' | 'error' | 'success'>('idle');
  const [exitErrorMessage, setExitErrorMessage] = useState<string | null>(null);

  // UI state
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [lastHandledDepositId, setLastHandledDepositId] = useState<string | null>(null);

  // Wallet context
  const { wallet, openModal, disconnectWallet } = useWalletContext();
  const shortAddress = useShortAddress();
  const walletAddress = wallet?.address ?? null;
  // connection is created on-demand inside handleDeposit to avoid any load-time RPC calls

  // Vault configuration
  const vaultConfig = getVaultBySlug("solis-yield-vault");
  const vaultName = vaultConfig?.name || "Solis Yield Vault";
  const vaultAPY = vaultConfig?.apyNumeric || 8.1;

  // Deposit/Withdrawal context
  const { deposits, refreshDeposits } = useDepositContext();
  const latestVaultDeposit = useMemo(
    () => deposits.find((deposit) => deposit.vaultName === vaultName),
    [deposits, vaultName]
  );
  
  const currentStatus = latestVaultDeposit?.status ?? "idle";
  const isPendingStatus = currentStatus === "pending" || currentStatus === "pending_withdrawal";
  const isConfirmedStatus = currentStatus === "confirmed";

  // Balance hook
  const { availableUSD } = useVaultAvailableUSD(walletAddress, vaultName);
  const { submit: submitWithdrawal, error: withdrawalError } = useWithdrawal();

  // Handle local success flags
  useEffect(() => {
    if (isConfirmedStatus && latestVaultDeposit) {
      const storageKey = `vaultfi:lastSeenConfirmation:solis-yield`;
      const lastSeenId = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (lastSeenId !== latestVaultDeposit.id) {
        setShowInlineSuccess(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, latestVaultDeposit.id);
        }
      } else {
        setShowInlineSuccess(false);
      }
    } else {
      setShowInlineSuccess(false);
    }
  }, [isConfirmedStatus, latestVaultDeposit]);

  // Clean success alert after timeout
  useEffect(() => {
    if (showInlineSuccess) {
      const id = setTimeout(() => setShowInlineSuccess(false), 8000);
      return () => clearTimeout(id);
    }
  }, [showInlineSuccess]);

  // Sync / hydrate check
  useEffect(() => {
    if (!latestVaultDeposit) return;
    if (!hasHydrated) {
      setHasHydrated(true);
      return;
    }
    if (latestVaultDeposit.id !== lastHandledDepositId && latestVaultDeposit.status === "confirmed") {
      toast.success("Position activated");
      setLastHandledDepositId(latestVaultDeposit.id);
    }
  }, [latestVaultDeposit, hasHydrated, lastHandledDepositId]);

  // Deposit transaction handler (Allocate Capital)
  const handleDeposit = async (amountSOL: number) => {
    const anyWindow = typeof window !== "undefined" ? (window as any) : undefined;
    const provider = anyWindow?.solana;

    if (!provider || !provider.isPhantom) {
      toast.error("Phantom wallet is not ready. Please install or reconnect.");
      return;
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet to deposit.");
      return;
    }

    if (wallet.chainType !== "solana") {
      toast.error("Please connect a Phantom (Solana) wallet.");
      return;
    }

    if (!Number.isFinite(amountSOL) || amountSOL <= 0) {
      setErrorMessage("Invalid allocation size");
      setDepositStep("error");
      return;
    }

    const price = solPriceUSD ?? 165;
    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("SOL price reference unavailable. Please try again.");
      setDepositStep("error");
      return;
    }

    const usdAmount = Number((amountSOL * price).toFixed(2));

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
      const connection = getConnection();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      let signature: string;
      try {
        const result = await provider.signAndSendTransaction(transaction);
        signature = typeof result === "string" ? result : result.signature;
      } catch (err) {
        console.error("Transaction error", err);
        setDepositStep("error");
        toast.error("Transaction signature rejected.");
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
        console.error("Transaction confirmation error (timeout/dropped)", err);
        toast.loading("Confirmation delayed. Verifying on backend...", { id: "delayed-verification" });
        // DO NOT return here! The transaction might still be on the blockchain. Let the backend verify it.
      }

      setDepositStep("calling-api");

      try {
        const response = await fetch("/api/verifyDeposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tx_hash: signature,
            wallet_address: provider.publicKey.toBase58(),
            vault_slug: "solis-yield-vault",
            amount_sol: amountSOL,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Verification failed");
        }

        await refreshDeposits();
        setDepositStep("idle");
        setAmount("");
        toast.success("Transaction verified. Capital allocation confirmed. Position activated.");
      } catch (err: any) {
        console.error("Verification error", err);
        setErrorMessage(err.message || "Failed to verify transaction on the backend.");
        setDepositStep("error");
        toast.error(err.message || "Position activation failed.");
      }
    } catch (err) {
      console.error("Unexpected allocation error", err);
      setDepositStep("error");
      toast.error("Unexpected allocation error.");
    } finally {
      setIsDepositing(false);
    }
  };

  // Withdrawal transaction handler (Liquidity Exit)
  const handleExit = async () => {
    if (!walletAddress || !exitAmount) {
      return;
    }
    if (wallet.chainType !== 'solana') {
      toast.error("Please connect a Phantom (Solana) wallet.");
      return;
    }
    setExitErrorMessage(null);
    setIsExiting(true);
    setExitStep('calling-api');

    const parsedAmount = parseFloat(exitAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setExitErrorMessage("Invalid exit amount");
      setExitStep('error');
      setIsExiting(false);
      return;
    }

    const price = solPriceUSD;
    if (!price || !Number.isFinite(price) || price <= 0) {
      setExitErrorMessage("Live index price unavailable. Please try again.");
      setExitStep('error');
      setIsExiting(false);
      return;
    }

    const usdEquivalentCents = Math.round(parsedAmount * price * 100);
    const availableCents = Math.round(Math.max(0, availableUSD || 0) * 100);

    if (usdEquivalentCents > availableCents) {
      setExitErrorMessage("Requested exit amount exceeds available liquidity limit.");
      setExitStep('error');
      setIsExiting(false);
      return;
    }

    const usdEquivalent = usdEquivalentCents / 100;
    const result = await submitWithdrawal({ wallet: walletAddress, vaultName, usdAmount: usdEquivalent });

    if (!result.ok) {
      setExitErrorMessage(withdrawalError || "Failed to submit exit request");
      setExitStep('error');
      setIsExiting(false);
      return;
    }

    setExitStep('success');
    setIsExiting(false);
    setExitAmount("");
    toast.success("Settlement processing initiated.");
    try { await refreshDeposits(); } catch {}
  };

  const handleConfirmSettlement = async () => {
    // Find the pending withdrawal for this vault
    const pendingWithdrawal = withdrawals.find(w => w.walletAddress === walletAddress && w.vaultName === vaultName && w.status === "pending");
    if (!pendingWithdrawal) return;
    
    setIsConfirming(true);
    try {
      const response = await fetch("/api/withdraw/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: pendingWithdrawal.id })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to process withdrawal");
      
      toast.success("Withdrawal confirmed successfully!");
      try { await refreshDeposits(); } catch {}
    } catch (e: any) {
      toast.error(e.message || "Failed to process withdrawal");
    } finally {
      setIsConfirming(false);
    }
  };

  // Auto reset exit success alert
  useEffect(() => {
    if (exitStep === 'success') {
      const id = setTimeout(() => setExitStep('idle'), 5000);
      return () => clearTimeout(id);
    }
  }, [exitStep]);

  // Telemetry computations for active positions
  const userConfirmedSolisDeposits = useMemo(() => {
    return deposits.filter(d => d.vaultName === vaultName && d.status === "confirmed" && d.amount > 0);
  }, [deposits, vaultName]);

  const totalAllocatedUSD = useMemo(() => {
    return userConfirmedSolisDeposits.reduce((sum, d) => sum + (d.usdAmount ?? 0), 0);
  }, [userConfirmedSolisDeposits]);

  const allocationTimestamp = useMemo(() => {
    if (userConfirmedSolisDeposits.length === 0) return "N/A";
    const sorted = [...userConfirmedSolisDeposits].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return new Date(sorted[0].createdAt).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }, [userConfirmedSolisDeposits]);

  const positionStatus = availableUSD > 0 ? "ACTIVE" : "INACTIVE";

  const settlementState = useMemo(() => {
    const hasPending = deposits.some(
      d => d.vaultName === vaultName && (d.status === "pending" || d.status === "pending_withdrawal")
    );
    return hasPending ? "PROCESSING" : "SETTLED";
  }, [deposits, vaultName]);

  const netChangeUSD = Math.max(0, availableUSD - totalAllocatedUSD);
  const netChangePct = totalAllocatedUSD > 0 ? (netChangeUSD / totalAllocatedUSD) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F5F5] pt-12 flex flex-col font-sans select-none antialiased">
      {/* SECTION 1 — HEAT SYSTEM HEADER */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#101010] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-widest text-[#F5F5F5]">HEAT</span>
        </div>

        {/* Center: System status indicators */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-[#8A8A8A]">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>TREASURY ACTIVE</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>SOLANA NETWORK ONLINE</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>SETTLEMENT OPERATIONAL</span>
          </div>
        </div>

        {/* Right: Wallet Connection Module */}
        <div>
          {!wallet.address ? (
            <button
              onClick={openModal}
              className="bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-mono text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm transition-all duration-150"
            >
              Connect Terminal
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center gap-2 bg-[#151515] border border-white/5 px-2.5 py-1 rounded-sm text-[10px] font-mono text-[#F5F5F5] hover:bg-white/[0.02] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[#8A8A8A] uppercase font-semibold text-[9px]">SOL:</span>
                <span>{shortAddress}</span>
              </button>
              {walletMenuOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-sm bg-[#101010] border border-white/10 shadow-lg z-50 text-[10px] font-mono">
                  <a
                    href={`https://explorer.solana.com/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-[#F5F5F5] hover:bg-white/[0.03]"
                    onClick={() => setWalletMenuOpen(false)}
                  >
                    VIEW ON EXPLORER
                  </a>
                  <button
                    className="w-full text-left px-3 py-2 text-[#F87171] hover:bg-white/[0.03] border-t border-white/5"
                    onClick={() => {
                      setWalletMenuOpen(false);
                      void disconnectWallet();
                    }}
                  >
                    DISCONNECT
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content terminal grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col gap-4">
        
        {/* SECTION 2 — SOLIS OPERATIONAL OVERVIEW */}
        <section className="bg-[#101010] border border-white/5 p-4 rounded-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-3 mb-4">
            <div>
              <h1 className="text-lg font-bold tracking-wider text-[#F5F5F5] font-mono uppercase">SOLIS</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8A8A8A]">Treasury Allocation System</p>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-1.5 bg-[#151515] px-2.5 py-1 border border-white/5 rounded-sm font-mono text-[9px] text-emerald-400 font-semibold tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM RUNNING
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
              <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Network</div>
              <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">SOLANA</div>
            </div>
            <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
              <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Treasury Status</div>
              <div className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">ACTIVE</div>
            </div>
            <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm col-span-2 md:col-span-1 lg:col-span-2">
              <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Current Treasury Exposure</div>
              <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">$423,456,879 USD</div>
            </div>
            <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
              <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Active Allocations</div>
              <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">1,248</div>
            </div>
            <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
              <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Settlement Window</div>
              <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">T+1 STANDARD</div>
            </div>
          </div>
        </section>

        {/* 2-Column Split Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* LEFT COLUMN: Capital Controls */}
          <div className="flex flex-col gap-4">
            
            {/* SECTION 3 — CAPITAL ALLOCATION TERMINAL */}
            <section className="bg-[#101010] border border-white/5 p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A8A]">CAPITAL ALLOCATION TERMINAL</div>
                  <div className="text-[9px] font-mono text-[#8A8A8A]">SETTLEMENT ROUTE: SOLIS-TREASURY</div>
                </div>

                <DepositAmountInput 
                  value={amount} 
                  onChange={setAmount} 
                  onPriceChangeAction={setSolPriceUSD} 
                  label="Allocation Amount"
                  solPrice={solPriceUSD}
                />
              </div>

              <div className="mt-4">
                {!wallet.address ? (
                  <button
                    onClick={openModal}
                    className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white font-mono text-xs uppercase tracking-wider font-semibold py-2.5 rounded-sm transition-all duration-150"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const parsed = parseFloat(amount);
                        void handleDeposit(parsed);
                      }}
                      disabled={
                        isDepositing ||
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        isPendingStatus
                      }
                      className="w-full bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 disabled:bg-[#151515] disabled:text-[#8A8A8A] disabled:border disabled:border-white/5 text-white font-mono text-xs uppercase tracking-wider font-semibold py-2.5 rounded-sm transition-all duration-150"
                    >
                      {isDepositing ? (
                        depositStep === 'signing' ? "Awaiting Signature" :
                        depositStep === 'confirming' ? "Verifying Transaction" :
                        depositStep === 'calling-api' ? "Activating Position" :
                        "Processing..."
                      ) : showInlineSuccess ? (
                        "Position Activated"
                      ) : (
                        "Allocate Capital"
                      )}
                    </button>

                    {/* Transaction Status Copy */}
                    {isPendingStatus && (
                      <div className="bg-[#151515] border border-white/5 p-2 rounded-sm text-center">
                        <div className="text-[#FACC15] text-[10px] font-mono uppercase tracking-wider animate-pulse">
                          Settlement processing in progress.
                        </div>
                      </div>
                    )}

                    {showInlineSuccess && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded-sm text-center">
                        <div className="text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                          Position Activated.
                        </div>
                        <div className="text-[#8A8A8A] text-[9px] font-mono mt-0.5">
                          Capital allocation ledger updated.
                        </div>
                      </div>
                    )}

                    {depositStep === "error" && errorMessage && (
                      <div className="bg-rose-950/20 border border-rose-500/30 p-2 rounded-sm text-center">
                        <div className="text-[#F87171] text-[10px] font-mono">
                          {errorMessage}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 6 — LIQUIDITY EXIT PANEL */}
            <section className="bg-[#101010] border border-white/5 p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A8A]">LIQUIDITY EXIT PANEL</div>
                  <div className="text-[9px] font-mono text-[#8A8A8A]">SETTLEMENT STATE: STANDARD LIQUIDATION</div>
                </div>

                {/* Display Available Liquidity */}
                <div className="mb-4 bg-[#151515] p-3 border border-white/5 rounded-sm">
                  <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Available Liquidity (USD)</div>
                  <div className="text-sm font-semibold text-[#F5F5F5] font-mono mt-0.5">
                    ${availableUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-[#8A8A8A]">USD</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8A8A8A] mt-0.5">
                    ≈ {(availableUSD / (solPriceUSD || 1)).toFixed(4)} SOL
                  </div>
                </div>

                <DepositAmountInput 
                  value={exitAmount} 
                  onChange={setExitAmount} 
                  onPriceChangeAction={setSolPriceUSD} 
                  label="Requested Exit Amount"
                  hideOracle={true}
                  solPrice={solPriceUSD}
                />
              </div>

              <div className="mt-4">
                {!wallet.address ? (
                  <button
                    disabled
                    className="w-full bg-[#151515] text-[#8A8A8A] border border-white/5 font-mono text-xs uppercase tracking-wider font-semibold py-2.5 rounded-sm cursor-not-allowed"
                  >
                    Awaiting connection
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleExit}
                      disabled={
                        isExiting ||
                        !exitAmount ||
                        parseFloat(exitAmount) <= 0 ||
                        isPendingStatus
                      }
                      className="w-full bg-[#151515] hover:bg-white/[0.02] border border-white/10 disabled:bg-[#151515] disabled:text-[#8A8A8A] disabled:border-white/5 text-[#F5F5F5] font-mono text-xs uppercase tracking-wider font-semibold py-2.5 rounded-sm transition-all duration-150"
                    >
                      {isExiting ? "Processing..." : "Request Liquidity Exit"}
                    </button>

                    {/* Settlement Status message */}
                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-2.5 mt-2">
                      <span className="text-[#8A8A8A] uppercase">Settlement Status</span>
                      <span className={`font-semibold ${
                        latestVaultDeposit?.status === "pending_withdrawal"
                          ? "text-[#FACC15] animate-pulse"
                          : "text-emerald-400"
                      }`}>
                        {latestVaultDeposit?.status === "pending_withdrawal"
                          ? "Settlement processing initiated"
                          : "Settled"}
                      </span>
                    </div>

                    {latestVaultDeposit?.status === "pending_withdrawal" && (
                      <button
                        onClick={handleConfirmSettlement}
                        disabled={isConfirming}
                        className="w-full mt-2 bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 disabled:bg-[#7C5CFC]/50 text-white font-mono text-xs uppercase tracking-wider font-semibold py-2 rounded-sm transition-all duration-150"
                      >
                        {isConfirming ? "Processing..." : "Confirm Settlement (Admin)"}
                      </button>
                    )}

                    {exitStep === "success" && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded-sm text-center">
                        <div className="text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                          Settlement processing initiated.
                        </div>
                      </div>
                    )}

                    {exitStep === "error" && exitErrorMessage && (
                      <div className="bg-rose-950/20 border border-rose-500/30 p-2 rounded-sm text-center">
                        <div className="text-[#F87171] text-[10px] font-mono">
                          {exitErrorMessage}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Telemetry outputs */}
          <div className="flex flex-col gap-4">
            
            {/* SECTION 4 — ACTIVE POSITION MONITOR */}
            <section className="bg-[#101010] border border-white/5 p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A8A]">ACTIVE POSITION MONITOR</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${availableUSD > 0 ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"}`}></span>
                    <span className="text-[9px] font-mono text-[#8A8A8A] uppercase font-semibold">{positionStatus}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
                    <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Position Value</div>
                    <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">
                      ${availableUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-[#8A8A8A]">USD</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8A8A8A] mt-0.5">
                      ≈ {(availableUSD / (solPriceUSD || 1)).toFixed(4)} SOL
                    </div>
                  </div>

                  <div className="bg-[#151515] p-2.5 border border-white/5 rounded-sm">
                    <div className="text-[9px] font-mono text-[#8A8A8A] uppercase tracking-wider">Treasury Exposure</div>
                    <div className="text-xs font-semibold text-[#F5F5F5] font-mono mt-0.5">
                      ${totalAllocatedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-[#8A8A8A]">USD</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8A8A8A] mt-0.5">
                      ≈ {(totalAllocatedUSD / (solPriceUSD || 1)).toFixed(4)} SOL
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-[10px] font-mono border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#8A8A8A] uppercase">Allocation Timestamp</span>
                    <span className="text-[#F5F5F5]">{allocationTimestamp}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#8A8A8A] uppercase">Settlement State</span>
                    <span className={`font-semibold ${settlementState === "PROCESSING" ? "text-[#FACC15] animate-pulse" : "text-emerald-400"}`}>
                      {settlementState}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#8A8A8A] uppercase">Performance Window</span>
                    <span className="text-[#F5F5F5]">T+30 DAYS</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#8A8A8A] uppercase">Net Position Change</span>
                    <span className={`font-semibold ${netChangeUSD > 0 ? "text-emerald-400" : "text-[#8A8A8A]"}`}>
                      +{netChangeUSD.toFixed(2)} USD (+{netChangePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5 — TREASURY ACTIVITY STREAM */}
            <section>
              <TreasuryActivityStream />
            </section>

          </div>

        </div>

      </main>
    </div>
  );
}
