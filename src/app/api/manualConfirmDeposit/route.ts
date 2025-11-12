import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    console.log("ManualConfirmDeposit API called");

    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
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

    const currentStatus = (existingDeposit as any).status;

    if (currentStatus === "confirmed") {
      return NextResponse.json({
        success: true,
        message: "Deposit was already confirmed",
        deposit: existingDeposit,
      });
    }

    const updatedDeposit = await prisma.deposit.update({
      where: { id: existingDeposit.id },
      data: { status: "confirmed" } as any,
      include: { user: true },
    });

    console.log("Deposit confirmed successfully:", updatedDeposit.id);

    return NextResponse.json({
      success: true,
      message: "Deposit confirmed successfully",
      deposit: updatedDeposit,
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
