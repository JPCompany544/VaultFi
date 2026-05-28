const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  const pos = await prisma.vaultPosition.findMany();
  console.log('Positions:', pos);
  await prisma.$disconnect();
}
check();
