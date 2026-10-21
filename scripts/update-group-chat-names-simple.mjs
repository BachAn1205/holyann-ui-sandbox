// Simple script to update group chat names without complex Prisma queries
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGroupChatNames() {
  try {
    console.log('🔄 Starting to update group chat room names...');

    // Use raw SQL to update the names
    const result = await prisma.$executeRaw`
      UPDATE chat_rooms 
      SET name = CONCAT('Nhóm mentor - ', (
          SELECT users.full_name 
          FROM users 
          WHERE users.id = chat_rooms.student_id
      ))
      WHERE type = 'GROUP' 
        AND name LIKE '% - Group Mentor'
        AND student_id IS NOT NULL
    `;

    console.log(`✅ Successfully updated ${result} group chat room names!`);

    // Verify the update with a simple query
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
    console.error('❌ Error updating group chat names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateGroupChatNames();
