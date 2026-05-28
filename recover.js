const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recoverDeposit() {
  try {
    const txHash = "z3BtcC76SR65DZhqdeucu9CLPryuGTUvtrotf4GqedEkqb2psbdfiW2GJYcirMXkaoHWup8WrbpYjraPT8ZL5ot";
    const walletAddress = "DNcNTQe5V7EVgg5LYX2KDH53pgrQafMXMS7KQeppkQok"; // Inferred from earlier logs
    const vaultName = "Solis Yield Vault";
    const amountSol = 0.0012;
    const expectedLamports = BigInt(Math.round(amountSol * 1_000_000_000));
    
    // Hardcoding a price to roughly $165 for 0.0012 SOL (~$0.20)
    const amountUsdCents = Math.round(amountSol * 165 * 100);
    const treasuryAddress = "3dUdf8boyak3DUcU992UvNtM8n5RTzpQqX35DUtmUCCR";

    console.log("Recovering deposit...");

    const result = await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { walletAddress },
        update: {},
        create: { walletAddress },
      });

      // Insert Deposit
      const deposit = await tx.deposit.create({
        data: {
          walletAddress,
          vaultName,
          amountSol: expectedLamports,
          amountUsd: amountUsdCents,
          txHash,
          treasuryAddress,
          status: "confirmed",
          confirmedAt: new Date(),
        },
      });

      // Insert Ledger
      await tx.treasuryLedger.create({
        data: {
          txHash,
          direction: "IN",
          amount: expectedLamports,
          asset: "SOL",
          verified: true,
        },
      });

      // Update VaultPosition
      const position = await tx.vaultPosition.upsert({
        where: {
          walletAddress_vaultName: {
            walletAddress,
            vaultName,
          },
        },
        update: {
          principalUsd: { increment: amountUsdCents },
          totalValueUsd: { increment: amountUsdCents },
        },
        create: {
          walletAddress,
          vaultName,
          principalUsd: amountUsdCents,
          rewardsUsd: 0,
          totalValueUsd: amountUsdCents,
        },
      });

      return { deposit, position };
    });

    console.log("Successfully recovered!");
    console.log(result);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

recoverDeposit();
