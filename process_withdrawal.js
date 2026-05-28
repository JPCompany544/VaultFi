const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processPendingWithdrawals() {
  try {
    console.log("Checking for pending withdrawals...");
    
    // Find all pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: { status: "pending" }
    });

    if (pendingWithdrawals.length === 0) {
      console.log("No pending withdrawals found.");
      return;
    }

    console.log(`Found ${pendingWithdrawals.length} pending withdrawal(s). Processing...`);

    for (const withdrawal of pendingWithdrawals) {
      console.log(`\n--- Processing Withdrawal ID: ${withdrawal.id} ---`);
      
      const postData = JSON.stringify({ withdrawal_id: withdrawal.id });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/withdraw/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let responseBody = '';
          res.on('data', (chunk) => { responseBody += chunk; });
          res.on('end', () => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Response: ${responseBody}`);
            resolve();
          });
        });

        req.on('error', (e) => {
          console.error(`Problem with request: ${e.message}`);
          reject(e);
        });

        req.write(postData);
        req.end();
      });
    }

    console.log("\nAll pending withdrawals have been processed successfully!");

  } catch (error) {
    console.error("Script Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

processPendingWithdrawals();
