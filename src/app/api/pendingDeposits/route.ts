import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    return NextResponse.json({
      success: true,
      deposits: pendingDeposits,
    });
  } catch (error: any) {
    console.error("Error fetching pending deposits:", error);
    
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
