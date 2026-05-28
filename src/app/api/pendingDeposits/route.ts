import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("PendingDeposits API called");

    // Get all pending deposits with user information
    const pendingDeposits = await prisma.deposit.findMany({
      where: { status: "pending" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${pendingDeposits.length} pending deposits`);

    // Format to prevent BigInt serialization issues in JSON
    const formattedDeposits = pendingDeposits.map((d) => ({
      id: d.id,
      walletAddress: d.walletAddress,
      vaultName: d.vaultName,
      amountSol: d.amountSol.toString(), // serialize BigInt as string
      amountUsd: d.amountUsd,
      txHash: d.txHash,
      status: d.status,
      createdAt: d.createdAt,
      user: {
        id: d.user.id,
        walletAddress: d.user.walletAddress,
      },
    }));

    return NextResponse.json({
      success: true,
      deposits: formattedDeposits,
    });
  } catch (error: any) {
    console.error("Error fetching pending deposits:", error);
    
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

