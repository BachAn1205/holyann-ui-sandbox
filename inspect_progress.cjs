const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const progresses = await prisma.student_task_progress.findMany({
    orderBy: { updated_at: 'desc' },
    take: 5,
  });
  console.log(JSON.stringify(progresses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
