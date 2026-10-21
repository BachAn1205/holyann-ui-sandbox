import 'dotenv/config';
import { prisma } from './src/lib/prisma';
async function main() { 
  const messages = await prisma.chat_messages.findMany({ 
    where: { 
      created_at: { 
        gte: new Date('2026-05-25T11:00:00Z'), 
        lte: new Date('2026-05-25T14:00:00Z') 
      } 
    }, 
    include: { 
      users: true, 
      chat_rooms: true 
    } 
  }); 
  console.log(JSON.stringify(messages, null, 2)); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
