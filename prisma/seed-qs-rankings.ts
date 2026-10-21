// @ts-nocheck — Pool vs Prisma adapter pg types mismatch (same as seed-universities.ts)
/**
 * Seed university_rankings từ QS 2026 CSV (cùng logic bulk import).
 * Chạy sau migrate: npx tsx prisma/seed-qs-rankings.ts
 * Yêu cầu: DIRECT_URL hoặc DATABASE_URL, file hoex/src/2026 Ranking.csv
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  findQs2026HeaderLine,
  parseCsvWithHeader,
  rowToQs2026Payload,
} from '../src/lib/qs-ranking-csv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, '../src/2026 Ranking.csv');

const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';
if (!connectionUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL required');
  process.exit(1);
}

const pool = new Pool({ connectionString: connectionUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BATCH = 150;

async function main() {
  let text: string;
  try {
    text = readFileSync(CSV_PATH, 'utf8');
  } catch {
    console.error(`❌ Không đọc được file: ${CSV_PATH}`);
    process.exit(1);
  }

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const headerIdx = findQs2026HeaderLine(lines);
  if (headerIdx < 0) {
    console.error('❌ Không tìm thấy header QS 2026 (Index, Rank, Country/Territory, Overall SCORE).');
    process.exit(1);
  }

  const rows = parseCsvWithHeader(lines, headerIdx);
  const payloads = rows
    .map((r) => rowToQs2026Payload(r))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (payloads.length === 0) {
    console.error('❌ Không có dòng hợp lệ.');
    process.exit(1);
  }

  await prisma.university_rankings.deleteMany({});

  let inserted = 0;
  for (let i = 0; i < payloads.length; i += BATCH) {
    const chunk = payloads.slice(i, i + BATCH);
    const res = await prisma.university_rankings.createMany({ data: chunk });
    inserted += res.count;
  }

  console.log(`✅ Đã seed ${inserted} trường từ QS 2026 (${payloads.length} dòng parse được).`);
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
