import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    console.log("ConfirmDeposit API called");
    
    // Parse request body with error handling
    let body: {
      wallet_address?: string;
      vault_name?: string;
      amount?: number | string;
      tx_hash?: string;
    };
    try {
      body = await req.json();
      console.log("Request body parsed:", body);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { wallet_address, vault_name, amount, tx_hash } = body;

    console.log("ConfirmDeposit request received:", { 
      wallet_address, 
      vault_name, 
      amount, 
      tx_hash 
    });

    // Validate required fields
    if (!wallet_address || !vault_name || !amount || !tx_hash) {
      console.error("Missing required fields:", { 
        wallet_address: !!wallet_address, 
        vault_name: !!vault_name, 
        amount: !!amount, 
        tx_hash: !!tx_hash 
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    const parsedAmount = typeof amount === "number" ? amount : parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("Invalid amount:", amount);
      return NextResponse.json(
        { success: false, error: "Invalid amount value" },
        { status: 400 }
      );
    }

    // Ensure user exists in database (upsert creates if not exists)
    const user = await prisma.user.upsert({
      where: { wallet: wallet_address },
      update: {}, // No updates needed if user exists
      create: { wallet: wallet_address },
    });

    console.log("User ensured:", user);

    // Store deposit in database with proper user relation
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount: parsedAmount,
        txHash: tx_hash,
        vaultName: vault_name,
        status: "pending" as any, // Default status for new deposits
      },
      include: {
        user: true, // Include user data in response
      },
    });

    console.log("Deposit created successfully:", deposit);

    return NextResponse.json({ 
      success: true, 
      message: 'Deposit confirmed successfully',
      deposit 
    });
  } catch (error: any) {
    console.error("Error confirming deposit:", error);
    
    // Ensure we always return valid JSON, even on unexpected errors
    const errorMessage = error?.message || "Internal server error";
    console.error("Returning error response:", errorMessage);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
