import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    let body: {
      wallet_address?: string;
      vault_name?: string;
      amount_usd?: number;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { wallet_address, vault_name, amount_usd } = body;

    // Validation
    if (!wallet_address || !vault_name || amount_usd === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (amount_usd <= 0) {
      return NextResponse.json({ success: false, error: "Invalid withdrawal amount" }, { status: 400 });
    }

    const amountCents = Math.round(amount_usd * 100);

    // Fetch user position
    const position = await prisma.vaultPosition.findUnique({
      where: {
        walletAddress_vaultName: {
          walletAddress: wallet_address,
          vaultName: vault_name,
        },
      },
    });

    if (!position) {
      return NextResponse.json({ success: false, error: "No active position found in this vault" }, { status: 400 });
    }

    // Fetch existing pending withdrawals to compute available balance
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        walletAddress: wallet_address,
        vaultName: vault_name,
        status: "pending",
      },
    });

    const pendingCents = pendingWithdrawals.reduce((sum, w) => sum + w.amountUsd, 0);
    const availableCents = position.totalValueUsd - pendingCents;

    if (amountCents > availableCents) {
      return NextResponse.json({
        success: false,
        error: `Insufficient available balance. Requested: $${amount_usd.toFixed(2)}, Available: $${(availableCents / 100).toFixed(2)}`
      }, { status: 400 });
    }

    // Create pending withdrawal
    const withdrawal = await prisma.withdrawal.create({
      data: {
        walletAddress: wallet_address,
        vaultName: vault_name,
        amountUsd: amountCents,
        destinationWallet: wallet_address, // defaults to user wallet
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request registered successfully and is now pending settlement.",
      withdrawal: {
        id: withdrawal.id,
        amount_usd: withdrawal.amountUsd / 100,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });

  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// Support fetching withdrawals list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const walletAddress = searchParams.get("wallet") || undefined;

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        status,
        walletAddress,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        walletAddress: w.walletAddress,
        vaultName: w.vaultName,
        amountUsd: w.amountUsd / 100,
        destinationWallet: w.destinationWallet,
        status: w.status,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
