import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Ensure BigInt is properly serialized to JSON (converted to string)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    const [deposits, positions, withdrawals] = await Promise.all([
      prisma.deposit.findMany({
        where: { walletAddress },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vaultPosition.findMany({
        where: { walletAddress },
      }),
      prisma.withdrawal.findMany({
        where: { walletAddress },
        orderBy: { createdAt: "desc" },
      })
    ]);

    return NextResponse.json({
      deposits,
      positions,
      withdrawals,
    });
  } catch (error: any) {
    console.error("Portfolio fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch portfolio" }, { status: 500 });
  }
}
