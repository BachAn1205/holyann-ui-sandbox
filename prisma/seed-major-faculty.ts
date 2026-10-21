// @ts-nocheck
/**
 * Seed major_faculty_catalog từ file major-faculty.csv.
 * Chạy sau migrate: npx tsx prisma/seed-major-faculty.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "../src/major-faculty.csv");
const BATCH_SIZE = 300;

const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
if (!connectionUrl) {
  console.error("❌ DATABASE_URL or DIRECT_URL required");
  process.exit(1);
}

const pool = new Pool({ connectionString: connectionUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function toNumber(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  let text: string;
  try {
    text = readFileSync(CSV_PATH, "utf8");
  } catch {
    console.error(`❌ Không đọc được file: ${CSV_PATH}`);
    process.exit(1);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    console.error("❌ File CSV không có dữ liệu.");
    process.exit(1);
  }

  const payloads = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      job_zone: toNumber(cols[0] ?? ""),
      occupation_code: (cols[1] ?? "").slice(0, 32) || null,
      occupation_name: (cols[2] ?? "").slice(0, 500),
      data_level: (cols[3] ?? "").slice(0, 20) || null,
      major_group_code: (cols[4] ?? "").slice(0, 32) || null,
      industry_group: (cols[5] ?? "").slice(0, 255) || null,
      major_score: toNumber(cols[6] ?? ""),
    };
  }).filter((item) => item.occupation_name.length > 0);

  if (payloads.length === 0) {
    console.error("❌ Không có dòng hợp lệ để seed.");
    process.exit(1);
  }

  await prisma.major_faculty_catalog.deleteMany({});

  let inserted = 0;
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const chunk = payloads.slice(i, i + BATCH_SIZE);
    const res = await prisma.major_faculty_catalog.createMany({ data: chunk });
    inserted += res.count;
  }

  console.log(`✅ Đã seed ${inserted} dòng vào major_faculty_catalog.`);
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
