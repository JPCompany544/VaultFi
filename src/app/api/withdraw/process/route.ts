import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as web3 from "@solana/web3.js";

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
  
  return 165.0; // fallback
}

export async function POST(req: Request) {
  try {
    let body: { withdrawal_id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { withdrawal_id } = body;
    if (!withdrawal_id) {
      return NextResponse.json({ success: false, error: "withdrawal_id is required" }, { status: 400 });
    }

    // 1. Fetch pending withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawal_id },
    });

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ success: false, error: `Withdrawal has already been processed (Status: ${withdrawal.status})` }, { status: 400 });
    }

    // 2. Fetch live price and convert to SOL lamports
    const solPrice = await fetchCurrentSolPrice();
    const amountUsd = withdrawal.amountUsd / 100;
    const amountSol = amountUsd / solPrice;
    const lamports = BigInt(Math.round(amountSol * web3.LAMPORTS_PER_SOL));

    console.log(`Processing withdrawal ${withdrawal.id}: $${amountUsd} USD -> ${amountSol.toFixed(6)} SOL (${lamports.toString()} lamports)`);

    // 3. Check for treasury secret key
    const secretKeyEnv = process.env.SOL_TREASURY_SECRET_KEY;
    let signature = "";
    let isSimulated = false;

    if (secretKeyEnv) {
      try {
        let secretKey: Uint8Array;
        if (secretKeyEnv.startsWith("[")) {
          secretKey = Uint8Array.from(JSON.parse(secretKeyEnv));
        } else {
          // Decode Phantom's Base58 private key format
          const bs58 = require('bs58');
          secretKey = bs58.decode(secretKeyEnv);
        }

        const treasuryKeypair = web3.Keypair.fromSecretKey(secretKey);
        const connection = getRPCConnection();
        const recipientPubkey = new web3.PublicKey(withdrawal.destinationWallet);

        const transaction = new web3.Transaction().add(
          web3.SystemProgram.transfer({
            fromPubkey: treasuryKeypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: Number(lamports),
          })
        );

        transaction.feePayer = treasuryKeypair.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        signature = await web3.sendAndConfirmTransaction(connection, transaction, [treasuryKeypair]);
        console.log(`On-chain withdrawal transfer confirmed. Tx: ${signature}`);
      } catch (err: any) {
        console.error("On-chain withdrawal execution failed:", err);
        return NextResponse.json({ success: false, error: `Transaction execution failed: ${err.message}` }, { status: 500 });
      }
    } else {
      // If treasury secret key is not set, simulate on-chain transfer
      isSimulated = true;
      signature = `sim-wth-tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      console.warn("SOL_TREASURY_SECRET_KEY env variable not set. Running in SIMULATED mode. Tx hash generated:", signature);
    }

    // 4. Update ledger and user positions inside an atomic transaction
    await prisma.$transaction(async (txClient) => {
      // Mark withdrawal as processed
      await txClient.withdrawal.update({
        where: { id: withdrawal_id },
        data: {
          status: "processed",
          processedAt: new Date(),
        },
      });

      // Update position (deduct principal and total value)
      const position = await txClient.vaultPosition.findUnique({
        where: {
          walletAddress_vaultName: {
            walletAddress: withdrawal.walletAddress,
            vaultName: withdrawal.vaultName,
          },
        },
      });

      if (position) {
        const nextPrincipal = Math.max(0, position.principalUsd - withdrawal.amountUsd);
        const nextTotal = Math.max(0, position.totalValueUsd - withdrawal.amountUsd);
        
        await txClient.vaultPosition.update({
          where: { id: position.id },
          data: {
            principalUsd: nextPrincipal,
            totalValueUsd: nextTotal,
          },
        });
      }

      // Add to treasury ledger
      await txClient.treasuryLedger.create({
        data: {
          txHash: signature,
          direction: "OUT",
          amount: lamports,
          asset: "SOL",
          verified: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request processed successfully ${isSimulated ? "(SIMULATED)" : ""}`,
      tx_hash: signature,
      withdrawal: {
        id: withdrawal.id,
        status: "processed",
        amount_usd: amountUsd,
      }
    });

  } catch (error: any) {
    console.error("Error processing withdrawal request:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
