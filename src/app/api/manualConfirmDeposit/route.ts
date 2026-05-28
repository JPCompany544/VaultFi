import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    console.log("ManualConfirmDeposit API called");

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { tx_hash, deposit_id } = body || {};

    if (!tx_hash && !deposit_id) {
      return NextResponse.json(
        { success: false, error: "tx_hash or deposit_id is required" },
        { status: 400 }
      );
    }

    const existingDeposit = await prisma.deposit.findFirst({
      where: {
        OR: [
          tx_hash ? { txHash: tx_hash } : undefined,
          deposit_id ? { id: deposit_id } : undefined,
        ].filter(Boolean) as any,
      },
      include: { user: true },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404 }
      );
    }

    if (existingDeposit.status === "confirmed") {
      return NextResponse.json({
        success: true,
        message: "Deposit was already confirmed",
        deposit: existingDeposit,
      });
    }

    // Perform atomic confirmation updates
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id: existingDeposit.id },
        data: {
          status: "confirmed",
          confirmedAt: new Date(),
        },
        include: { user: true },
      });

      // 2. Update VaultPosition
      const position = await tx.vaultPosition.upsert({
        where: {
          walletAddress_vaultName: {
            walletAddress: existingDeposit.walletAddress,
            vaultName: existingDeposit.vaultName,
          },
        },
        update: {
          principalUsd: { increment: existingDeposit.amountUsd },
          totalValueUsd: { increment: existingDeposit.amountUsd },
        },
        create: {
          walletAddress: existingDeposit.walletAddress,
          vaultName: existingDeposit.vaultName,
          principalUsd: existingDeposit.amountUsd,
          rewardsUsd: 0,
          totalValueUsd: existingDeposit.amountUsd,
        },
      });

      // 3. Create ledger entry
      await tx.treasuryLedger.upsert({
        where: { txHash: existingDeposit.txHash },
        update: { verified: true },
        create: {
          txHash: existingDeposit.txHash,
          direction: "IN",
          amount: existingDeposit.amountSol,
          asset: "SOL",
          verified: true,
        },
      });

      return updatedDeposit;
    });

    console.log("Deposit manually confirmed successfully:", result.id);

    const formattedDeposit = {
      id: result.id,
      walletAddress: result.walletAddress,
      vaultName: result.vaultName,
      amountSol: result.amountSol.toString(),
      amountUsd: result.amountUsd,
      txHash: result.txHash,
      status: result.status,
      createdAt: result.createdAt,
      user: {
        id: result.user.id,
        walletAddress: result.user.walletAddress,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Deposit manually confirmed successfully",
      deposit: formattedDeposit,
    });
  } catch (error: any) {
    console.error("Error confirming deposit:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
