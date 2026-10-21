import { prisma } from './src/lib/prisma';

async function main() {
  console.log('Adding columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE IF EXISTS major_faculty_catalog 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID NULL;
  `);
  
  console.log('Adding indexes...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS major_faculty_catalog_status_idx ON major_faculty_catalog(status);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS major_faculty_catalog_created_by_user_id_idx ON major_faculty_catalog(created_by_user_id);
  `);
  
  console.log("Columns added successfully");
}

main().catch(console.error).finally(() => prisma.$disconnect());
