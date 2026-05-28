import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    console.log("ConfirmedDeposits API called");

    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress },
      include: {
        deposits: {
          where: { status: "confirmed" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        deposits: [],
        totalAssets: 0,
        vaultCount: 0,
        totalEarnings: 0,
        uniqueVaults: [],
      });
    }

    // Calculate dashboard metrics
    const confirmedDeposits = user.deposits.map((d) => ({
      id: d.id,
      wallet: d.walletAddress,
      vaultName: d.vaultName,
      amount: Number(d.amountSol) / 1e9,
      usdAmount: d.amountUsd / 100,
      txHash: d.txHash,
      status: d.status,
      createdAt: d.createdAt,
    }));

    const totalAssets = confirmedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const uniqueVaults = Array.from(new Set(confirmedDeposits.map(d => d.vaultName).filter(Boolean)));
    const vaultCount = uniqueVaults.length;
    const totalEarnings = 0; // Placeholder

    console.log(`Found ${confirmedDeposits.length} confirmed deposits for user ${user.walletAddress}`);

    return NextResponse.json({
      success: true,
      deposits: confirmedDeposits,
      totalAssets,
      vaultCount,
      totalEarnings,
      uniqueVaults,
    });
  } catch (error: any) {
    console.error("Error fetching confirmed deposits:", error);
    
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

