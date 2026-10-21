import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';
if (!connectionUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL required');
  process.exit(1);
}
const pool = new Pool({ connectionString: connectionUrl });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting to seed load test users...');
  
  const usersToCreate = [];
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Prepare 100 users
  for (let i = 1; i <= 100; i++) {
    const email = `loadtest_student_${i}@holyannexplore.com`;
    usersToCreate.push({
      email,
      fullName: `LoadTest Student ${i}`,
    });
  }

  const generatedUsers = [];

  for (const item of usersToCreate) {
    // Check if user already exists
    let user = await prisma.users.findUnique({
      where: { email: item.email }
    });

    if (!user) {
      const userId = crypto.randomUUID();
      user = await prisma.users.create({
        data: {
          id: userId,
          full_name: item.fullName,
          email: item.email,
          password_hash: passwordHash,
          role: 'STUDENT',
          is_verified: true,
          is_active: true,
          subscription_plan: 'PREMIUM',
        }
      });

      // Also create a student profile
      await prisma.students.create({
        data: {
          user_id: userId,
          current_school: 'LoadTest School',
          current_grade: '12',
          assessments_completed: false,
        }
      });
      console.log(`✅ Created user & student: ${item.email}`);
    } else {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { subscription_plan: 'PREMIUM' }
      });
      console.log(`ℹ️ User already exists, updated to PREMIUM: ${item.email}`);
    }

    generatedUsers.push({
      email: item.email,
      password: 'Password123!',
      id: user.id
    });
  }

  // Ensure target folder exists
  const dirPath = path.resolve('tests/load');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Save to json
  const filePath = path.join(dirPath, 'loadtest_users.json');
  fs.writeFileSync(filePath, JSON.stringify(generatedUsers, null, 2), 'utf-8');
  console.log(`🎉 Successfully wrote ${generatedUsers.length} user credentials to ${filePath}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
