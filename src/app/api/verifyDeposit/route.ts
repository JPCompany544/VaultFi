import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as web3 from "@solana/web3.js";
import { getVaultBySlug } from "@/config/vaults";

// Retrieve treasury configuration from environment variables
const SOL_TREASURY_ADDRESS = process.env.SOL_TREASURY_ADDRESS || "3dUdf8boyak3DUcU992UvNtM8n5RTzpQqX35DUtmUCCR";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// RPC Connection builder
function getRPCConnection() {
  const rpcUrl = HELIUS_API_KEY 
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : "https://api.mainnet-beta.solana.com";
  return new web3.Connection(rpcUrl, "confirmed");
}

// Fetch current SOL price from Jupiter/CoinGecko for USD accounting
async function fetchCurrentSolPrice(): Promise<number> {
  try {
    const res = await fetch("https://api.jup.ag/price/v2?ids=SOL");
    if (res.ok) {
      const json = await res.json();
      const price = Number(json.data?.SOL?.price);
      if (price > 0) return price;
    }
  } catch (e) {
    console.error("Failed to fetch Jupiter price, trying CoinGecko fallback...", e);
  }
  
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    if (res.ok) {
      const json = await res.json();
      const price = Number(json.solana?.usd);
      if (price > 0) return price;
    }
  } catch (e) {
    console.error("CoinGecko fallback failed", e);
  }
  
  return 165.0; // static fallback as safety measure
}

export async function POST(req: Request) {
  try {
    let body: {
      tx_hash?: string;
      wallet_address?: string;
      vault_slug?: string;
      amount_sol?: number;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { tx_hash, wallet_address, vault_slug, amount_sol } = body;

    // 1. Basic validation
    if (!tx_hash || !wallet_address || !vault_slug || amount_sol === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (amount_sol <= 0) {
      return NextResponse.json({ success: false, error: "Invalid deposit amount" }, { status: 400 });
    }

    // 2. Validate vault exists
    const vaultConfig = getVaultBySlug(vault_slug);
    if (!vaultConfig) {
      return NextResponse.json({ success: false, error: "Invalid vault identifier" }, { status: 400 });
    }
    const vaultName = vaultConfig.name;

    // 3. Prevent replay attacks (check if transaction is already processed)
    const existingDeposit = await prisma.deposit.findUnique({
      where: { txHash: tx_hash },
    });

    if (existingDeposit) {
      return NextResponse.json({ success: false, error: "Transaction has already been processed" }, { status: 400 });
    }

    // 4. Connect to Solana and fetch parsed transaction
    const connection = getRPCConnection();
    let tx: web3.ParsedTransactionWithMeta | null = null;
    
    try {
      tx = await connection.getParsedTransaction(tx_hash, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
    } catch (err: any) {
      console.error("Error fetching Solana transaction:", err);
      return NextResponse.json({ success: false, error: `Failed to fetch transaction: ${err.message}` }, { status: 500 });
    }

    if (!tx) {
      // Transaction might be delayed. Store as pending so we don't lose the user's signature!
      const price = await fetchCurrentSolPrice();
      const amountUsdCents = Math.round(amount_sol * price * 100);
      const expectedLamports = BigInt(Math.round(amount_sol * web3.LAMPORTS_PER_SOL));

      await prisma.user.upsert({
        where: { walletAddress: wallet_address },
        update: {},
        create: { walletAddress: wallet_address },
      });

      const pendingDeposit = await prisma.deposit.upsert({
        where: { txHash: tx_hash },
        update: {},
        create: {
          walletAddress: wallet_address,
          vaultName: vaultName,
          amountSol: expectedLamports,
          amountUsd: amountUsdCents,
          txHash: tx_hash,
          treasuryAddress: SOL_TREASURY_ADDRESS,
          status: "pending",
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Transaction sent. Awaiting on-chain confirmation.", 
        status: "pending",
        deposit: { id: pendingDeposit.id, status: "pending", tx_hash }
      });
    }

    // 5. Verify transaction executed successfully
    if (tx.meta?.err) {
      return NextResponse.json({ success: false, error: "Transaction failed on-chain" }, { status: 400 });
    }

    // 6. Verify transfer instruction
    let verified = false;
    let senderAddress = "";
    let recipientAddress = "";
    let lamportsTransferred = BigInt(0);

    const expectedLamports = BigInt(Math.round(amount_sol * web3.LAMPORTS_PER_SOL));
    const instructions = tx.transaction.message.instructions;

    for (const inst of instructions) {
      if ("program" in inst && inst.program === "system" && inst.parsed?.type === "transfer") {
        const info = inst.parsed.info;
        if (
          info.source === wallet_address &&
          info.destination === SOL_TREASURY_ADDRESS &&
          BigInt(info.lamports) === expectedLamports
        ) {
          verified = true;
          senderAddress = info.source;
          recipientAddress = info.destination;
          lamportsTransferred = BigInt(info.lamports);
          break;
        }
      }
    }

    if (!verified) {
      console.warn("SOL deposit verification failed", {
        tx_hash,
        wallet_address,
        SOL_TREASURY_ADDRESS,
        expectedLamports: expectedLamports.toString()
      });
      return NextResponse.json({ success: false, error: "Transaction verification failed: Transfer instruction mismatch" }, { status: 400 });
    }

    // 7. Get current SOL price for accurate accounting
    const price = await fetchCurrentSolPrice();
    const amountUsdCents = Math.round(amount_sol * price * 100);

    // 8. Atomic Database Persistence using Prisma Transaction
    const result = await prisma.$transaction(async (txClient) => {
      // Ensure user exists
      const user = await txClient.user.upsert({
        where: { walletAddress: wallet_address },
        update: {},
        create: { walletAddress: wallet_address },
      });

      // Insert Deposit
      const deposit = await txClient.deposit.create({
        data: {
          walletAddress: wallet_address,
          vaultName: vaultName,
          amountSol: expectedLamports,
          amountUsd: amountUsdCents,
          txHash: tx_hash,
          treasuryAddress: SOL_TREASURY_ADDRESS,
          status: "confirmed",
          confirmedAt: new Date(),
        },
      });

      // Insert into Treasury Ledger
      await txClient.treasuryLedger.create({
        data: {
          txHash: tx_hash,
          direction: "IN",
          amount: expectedLamports,
          asset: "SOL",
          verified: true,
        },
      });

      // Update VaultPosition
      const position = await txClient.vaultPosition.upsert({
        where: {
          walletAddress_vaultName: {
            walletAddress: wallet_address,
            vaultName: vaultName,
          },
        },
        update: {
          principalUsd: { increment: amountUsdCents },
          totalValueUsd: { increment: amountUsdCents },
        },
        create: {
          walletAddress: wallet_address,
          vaultName: vaultName,
          principalUsd: amountUsdCents,
          rewardsUsd: 0,
          totalValueUsd: amountUsdCents,
        },
      });

      return { deposit, position };
    });

    console.log("Deposit verified and recorded:", result);

    return NextResponse.json({
      success: true,
      message: "Deposit verified and position activated successfully",
      deposit: {
        id: result.deposit.id,
        status: result.deposit.status,
        amount_sol: amount_sol,
        amount_usd: amountUsdCents / 100,
        tx_hash: result.deposit.txHash,
      },
      position: {
        principal_usd: result.position.principalUsd / 100,
        rewards_usd: result.position.rewardsUsd / 100,
        total_value_usd: result.position.totalValueUsd / 100,
      }
    });

  } catch (error: any) {
    console.error("Unexpected verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
