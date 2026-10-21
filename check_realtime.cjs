const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$queryRaw`SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`;
  console.log(res);
}

main().finally(() => prisma.$disconnect());
