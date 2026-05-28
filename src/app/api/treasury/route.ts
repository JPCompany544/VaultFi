import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Ensure BigInt is properly serialized to JSON (converted to string)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function GET() {
  try {
    const ledger = await prisma.treasuryLedger.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: ledger,
    });
  } catch (error: any) {
    console.error("Treasury ledger fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch ledger" }, { status: 500 });
  }
}
