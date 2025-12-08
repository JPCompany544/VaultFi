"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { useWalletContext } from "@/context/WalletContext";
import { supabase } from "@/lib/supabase";
import { useDepositContext } from "@/context/DepositContext";
import { SOL_TREASURY_ADDRESS } from "@/constants";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wallet, DollarSign, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { shouldRedirectToPhantom, openInPhantomBrowser } from "@/utils/mobile";


/**
 * VaultDepositPage
 * 
 * Implements the "Load Vault Balance" feature.
 * - Converts USD input to SOL using live prices.
 * - Executes a SOL transfer transaction via Phantom wallet.
 * - Uses a dedicated Alchemy RPC endpoint for reliability.
 * - Logs successful deposits to Supabase and updates application state.
 */

// alchemy endpoint provided by user
const RPC_ENDPOINT = "https://solana-mainnet.g.alchemy.com/v2/qE99NzHtbbRNfpetHDaOVVe2UjMvKmKl";
const CHAINS = ["Solana", "Ethereum", "Base", "Arbitrum"];

export default function VaultDepositPage() {
    const router = useRouter();
    const { wallet, connectPhantom } = useWalletContext();
    const { refreshDeposits } = useDepositContext();

    // -- State --
    const [amount, setAmount] = useState(""); // User input in USD
    const [chain, setChain] = useState("Solana");
    const [solPrice, setSolPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [depositSuccess, setDepositSuccess] = useState(false); // Controls success modal
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // -- 1. Fetch Live SOL Price --
    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error("Price fetch failed");
                const data = await res.json();
                setSolPrice(Number(data?.solana?.usd));
            } catch (e) {
                console.error("Failed to fetch SOL price", e);
            }
        };

        fetchSolPrice();
        const id = setInterval(fetchSolPrice, 30000); // 30s refresh
        return () => clearInterval(id);
    }, []);

    // -- 2. Computed SOL Amount --
    // USD -> SOL conversion with memoization to prevent recalculations
    const solAmount = useMemo(() => {
        const usdVal = parseFloat(amount);
        if (!solPrice || isNaN(usdVal) || usdVal <= 0) return 0;
        return usdVal / solPrice;
    }, [amount, solPrice]);

    // -- 3. Handle Input Change --
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow numeric decimal input only (positive)
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setAmount(val);
            setError(null); // Clear error on interaction
        }
    };

    // -- 4. Handle Deposit Action --
    const handleActivate = useCallback(async () => {
        setError(null);
        setTxSignature(null);

        // A. Mobile Check: Redirect to Phantom browser if on mobile
        if (shouldRedirectToPhantom()) {
            // Redirect mobile users to Phantom's in-app browser
            // where wallet connection will work seamlessly
            openInPhantomBrowser();
            return;
        }

        // B. Validation: Wallet must be connected
        if (!wallet?.address) {
            try {
                await connectPhantom();
            } catch (err) {
                console.error("Connection failed", err);
                setError("Failed to connect wallet.");
            }
            return;
        }

        // B. Validation: Positive amount required
        if (!solAmount || solAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        setLoading(true);

        try {
            // C. Wallet & Connection Setup
            const provider = (window as any).solana;
            if (!provider || !provider.isPhantom) {
                throw new Error("Phantom wallet not found. Please install it.");
            }

            // critical: use the specific alchemy rpc endpoint
            const connection = new web3.Connection(RPC_ENDPOINT, "confirmed");

            const fromPubkey = new web3.PublicKey(wallet.address);
            const treasuryPubkey = new web3.PublicKey(SOL_TREASURY_ADDRESS);

            // D. Conversion: SOL -> Lamports
            // 1 SOL = 1e9 lamports. Math.round ensures integer for chain.
            const lamports = Math.round(solAmount * web3.LAMPORTS_PER_SOL);

            if (lamports <= 0) {
                throw new Error("Amount is too small to transact.");
            }

            console.log("Preparing transaction...", {
                from: fromPubkey.toBase58(),
                to: treasuryPubkey.toBase58(),
                sol: solAmount,
                lamports,
                usd: amount
            });

            // A. Build Transaction
            const transaction = new web3.Transaction().add(
                web3.SystemProgram.transfer({
                    fromPubkey,
                    toPubkey: treasuryPubkey,
                    lamports,
                })
            );

            transaction.feePayer = fromPubkey;

            // Get latest blockhash immediately before signing
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
            transaction.recentBlockhash = blockhash;

            // B. Sign Transaction (Phantom)
            const signedTransaction = await provider.signTransaction(transaction);
            const rawTransaction = signedTransaction.serialize();

            // C. Robust Send & Confirm Loop
            // We implement a custom loop to:
            // 1. Avoid 'signatureSubscribe' errors (WebSocket issues) by polling HTTP.
            // 2. Re-broadcast the tx to ensure it lands (fixing blockhash exceeded errors).

            let signature = "";
            let confirmed = false;

            // Initial send
            signature = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true, // skip preflight to reduce latency/errors
            });
            console.log("Tx Sent (Initial):", signature);
            setTxSignature(signature);

            const startTime = Date.now();
            while (!confirmed) {
                // Check if expired
                const currentBlockHeight = await connection.getBlockHeight("confirmed");
                if (currentBlockHeight > lastValidBlockHeight) {
                    throw new Error("Transaction expired. Please try again.");
                }

                // Check status
                const statusResponse = await connection.getSignatureStatuses([signature]);
                const status = statusResponse.value[0];

                if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
                    confirmed = true;
                    if (status.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                    }
                    console.log("Transaction Confirmed:", signature);
                    break;
                }

                // Re-broadcast (Spam) to ensure delivery
                // This is safe because exact same transaction signature is idempotent
                try {
                    await connection.sendRawTransaction(rawTransaction, {
                        skipPreflight: true,
                    });
                } catch (ignore) {
                    // Ignore "already processed" errors during re-broadcast
                }

                // Wait 2s before next check
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Timeout safety (60s)
                if (Date.now() - startTime > 60000) {
                    throw new Error("Transaction confirmation timed out.");
                }
            }

            // H. Log to Supabase
            // We log this after confirmation to ensure data integrity
            const { error: dbError } = await supabase.from("deposits").insert({
                wallet: wallet.address,
                vault_name: "vault_balance", // Marker for balance loads
                amount: solAmount,
                amount_usd: parseFloat(amount),
                tx_hash: signature,
                status: "confirmed",
                created_at: new Date().toISOString(),
                apy: 0,
                claimable_rewards: 0
            });

            if (dbError) {
                console.error("DB Log Error:", dbError);
                // Note: We don't fail the UI flow here because the money is already moved on-chain.
            }

            // I. Update Global State
            refreshDeposits();

            // Persist local data for vault-activated page consistency (optional but helpful)
            localStorage.setItem("vaultAmount", amount);
            localStorage.setItem("vaultChain", chain);
            localStorage.setItem("vaultTx", signature);

            setDepositSuccess(true); // Trigger success modal

            // J. Redirect
            // Redirect happens after a short delay to let user see success state
            setTimeout(() => {
                router.push("/vault-activated");
            }, 3000);

        } catch (e: any) {
            console.error("Deposit execution failed", e);

            let msg = "Transaction failed. Please try again.";
            if (e.message?.includes("User rejected")) msg = "Transaction cancelled by user.";
            else if (e.message?.includes("Insufficient funds")) msg = "Insufficient funds for transaction + fees.";
            else if (e.message) msg = e.message;

            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [wallet?.address, solAmount, amount, chain, connectPhantom, refreshDeposits, router]);


    // -- UI Render --

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E11] text-white p-4 overflow-hidden relative">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 flex flex-col items-center text-center max-w-lg w-full"
            >
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-sm">
                    Load Your Vault Balance
                </h1>

                <p className="text-gray-400 text-sm md:text-base font-light mb-12 max-w-md">
                    Your vault needs an initial balance to begin mirroring the extracted earning behaviour.
                </p>

                {/* --- Input Section --- */}
                <div className="w-full max-w-sm mb-6 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter amount"
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-14 py-4 text-white placeholder:text-gray-600 outline-none transition-all text-lg font-medium"
                        disabled={loading || depositSuccess}
                        min="0"
                        step="any"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm pointer-events-none">
                        USD
                    </div>
                </div>

                {/* --- Conversion Info --- */}
                <div className="w-full max-w-sm mb-6 flex justify-between items-center px-2">
                    <span className="text-sm text-gray-400">
                        Paying with SOL
                    </span>
                    <span className="text-sm font-mono text-emerald-400">
                        ≈ {solAmount > 0 ? solAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : "0.00"} SOL
                    </span>
                </div>

                {/* Price Ticker */}
                <div className="w-full max-w-sm mb-8 flex justify-end px-2">
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                        {solPrice ? (
                            <>
                                <span>1 SOL = ${solPrice.toFixed(2)}</span>
                                <span className="text-emerald-500/50">•</span>
                                <span className="text-emerald-500">Live</span>
                            </>
                        ) : "Fetching price..."}
                    </span>
                </div>


                {/* --- Chain Selector --- */}
                <div className="w-full max-w-sm mb-10 flex justify-end">
                    <div className="relative inline-block">
                        <select
                            value={chain}
                            onChange={(e) => setChain(e.target.value)}
                            className="appearance-none bg-transparent border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/30 focus:outline-none transition-colors cursor-pointer"
                            disabled={loading || depositSuccess}
                        >
                            {CHAINS.map(c => <option key={c} value={c} className="bg-[#0B0E11] text-white">{c}</option>)}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* --- Action Button --- */}
                {!wallet?.address ? (
                    <button
                        onClick={() => {
                            // Check if mobile user should be redirected to Phantom browser
                            if (shouldRedirectToPhantom()) {
                                openInPhantomBrowser();
                            } else {
                                connectPhantom();
                            }
                        }}
                        disabled={loading}
                        className="w-full max-w-sm rounded-xl py-4 font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                        <Wallet className="w-5 h-5" />
                        <span>Connect Wallet</span>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleActivate}
                            disabled={!amount || loading || parseFloat(amount) <= 0 || depositSuccess}
                            className={`w-full max-w-sm rounded-xl py-4 font-semibold text-black transition-all duration-300 flex items-center justify-center gap-2
                                ${!amount || loading || parseFloat(amount) <= 0 || depositSuccess
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-[#4ADE80] hover:bg-[#22c55e] hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] transform hover:-translate-y-0.5"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Activating...</span>
                                </>
                            ) : depositSuccess ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Activation Complete</span>
                                </>
                            ) : (
                                "Activate Vault"
                            )}
                        </button>

                        {/* Error Message Display */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs max-w-xs text-center flex items-center gap-2 justify-center"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Trust Copy */}
                <p className="mt-6 text-xs text-gray-600 font-medium">
                    Funds stay in your personal vault. You can withdraw anytime.
                </p>

            </motion.div>

            {/* --- Success Modal Overlay --- */}
            <AnimatePresence>
                {depositSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center max-w-sm mx-4 shadow-2xl relative"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Deposit Successful!</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Your vault balance has been loaded. Redirecting you to the dashboard...
                            </p>

                            {txSignature && (
                                <a
                                    href={`https://solscan.io/tx/${txSignature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 underline mb-6"
                                >
                                    <span>View Transaction</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}

                            <div className="flex items-center gap-2 text-[#4ADE80]">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Redirecting...</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
