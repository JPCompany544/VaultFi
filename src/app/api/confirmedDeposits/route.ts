import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    console.log("ConfirmedDeposits API called");

    // Get wallet address from query params
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
      where: { wallet: walletAddress },
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
      });
    }

    // Calculate dashboard metrics
    const confirmedDeposits = ((user as any).deposits ?? []) as Array<{
      amount: number;
      vaultName: string | null;
      createdAt: Date;
    }>;
    const totalAssets = confirmedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const uniqueVaults = [...new Set(confirmedDeposits.map(d => d.vaultName).filter(Boolean))];
    const vaultCount = uniqueVaults.length;
    const totalEarnings = 0; // Placeholder for future implementation

    console.log(`Found ${confirmedDeposits.length} confirmed deposits for user ${user.wallet}`);

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
