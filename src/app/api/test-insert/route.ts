import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Create a new user
    const user = await prisma.user.create({
      data: {
        wallet: "0xABC1234567890TESTWALLET",
      },
    });

    // 2. Create a deposit for that user
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount: 50.0,
        txHash: "0xtesthash123",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user,
        deposit,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, error }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}
