import dotenv from 'dotenv';
dotenv.config();

const { prisma } = await import('./src/lib/prisma.js');

async function main() {
  const tasks = await prisma.checklist_tasks.findMany({
    select: { id: true, title: true }
  });
  console.log(JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
