import dotenv from 'dotenv';
dotenv.config();

const { prisma } = await import('./src/lib/prisma.js');

async function main() {
  const user = await prisma.users.findUnique({
    where: { id: "ec79aa1c-2cc2-4492-aa75-d19c9405b31d" },
  });
  console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
