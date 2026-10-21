import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check current publication
    const res = await prisma.$queryRaw`SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`;
    console.log("Current tables in supabase_realtime:");
    console.log(res);

    // Ensure chat_participants is in the publication
    await prisma.$executeRaw`ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants`;
    console.log("Successfully added chat_participants to supabase_realtime publication.");
  } catch (error) {
    if (error.message.includes('already in publication')) {
      console.log("Table chat_participants is already in supabase_realtime publication.");
    } else {
      console.error("Error modifying publication:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
