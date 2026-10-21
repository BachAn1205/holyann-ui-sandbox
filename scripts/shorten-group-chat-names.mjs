// Script to shorten existing GROUP chat room names
// From: "Nhóm hỗ trợ học tập (Full Team) - st2"
// To: "Nhóm mentor - st2"

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function shortenGroupChatNames() {
  try {
    console.log('🔄 Starting to shorten group chat room names...');

    // Use raw SQL to update the names
    const result = await prisma.$executeRaw`
      UPDATE chat_rooms 
      SET name = REGEXP_REPLACE(name, '^Nhóm hỗ trợ học tập \\(Full Team\\) - ', 'Nhóm mentor - ')
      WHERE type = 'GROUP' 
        AND name LIKE 'Nhóm hỗ trợ học tập (Full Team) - %'
    `;

    console.log(`✅ Successfully updated ${result} group chat room names!`);

    // Verify the update
    console.log('\n🔍 Verifying updates...');
    const updatedRooms = await prisma.$queryRaw`
      SELECT id, name, type, student_id, created_at
      FROM chat_rooms 
      WHERE type = 'GROUP'
      ORDER BY created_at DESC
    `;

    console.log(`📋 All GROUP rooms after update:`);
    updatedRooms.forEach((room, index) => {
      console.log(`   ${index + 1}. "${room.name}" (ID: ${room.id})`);
    });

  } catch (error) {
    console.error('❌ Error shortening group chat names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
shortenGroupChatNames();
