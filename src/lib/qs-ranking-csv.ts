import { countryNameToIso2 } from '@/lib/country-to-iso';

/** Parse one CSV line respecting double-quoted fields */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cur += c;
    } else if (c === ',') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvWithHeader(lines: string[], headerLineIndex: number): Record<string, string>[] {
  if (headerLineIndex < 0 || headerLineIndex >= lines.length) return [];
  const header = parseCsvLine(lines[headerLineIndex]);
  const rows: Record<string, string>[] = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 1 && values[0] === '') continue;
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      row[h.trim()] = values[j] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function num(v: string): number | null {
  if (v == null || v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function toFloat(v: string, fallback = 0): number {
  const n = num(v);
  return n != null ? n : fallback;
}

/** Lấy số đầu tiên trong chuỗi hạng QS: "1401+", "7=", "801+" → 1401, 7, 801 */
export function parseRankSortInt(rank: string): number | null {
  const s = String(rank).trim();
  if (!s || s === '-') return null;
  const m = s.match(/^(\d+)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

/** Nhận diện CSV QS World 2026 (header có Index + Overall SCORE) */
export function findQs2026HeaderLine(lines: string[]): number {
  return lines.findIndex(
    (l) =>
      /^\s*Index\s*,/i.test(l) &&
      l.includes('Overall SCORE') &&
      l.includes('Country/Territory'),
  );
}

export type Qs2026RowPayload = {
  qs_rank: number;
  previous_rank: string | null;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  size: string | null;
  focus: string | null;
  research_level: string | null;
  type: string | null;
  qs_overall_score: number | null;
  ranking_year: number;
  academic_reputation: number;
  employer_reputation: number;
  faculty_student_ratio: number;
  citations_per_faculty: number;
  international_faculty: number;
  international_students: number;
  isd_score: number | null;
  irn_score: number | null;
  eo_score: number | null;
  sus_score: number | null;
  ar_rank: string | null;
  er_rank: string | null;
  fsr_rank: string | null;
  cpf_rank: string | null;
  ifr_rank: string | null;
  isr_rank: string | null;
  isd_rank: string | null;
  irn_rank: string | null;
  eo_rank: string | null;
  sus_rank: string | null;
};

function emptyOr(s: string): string | null {
  const t = s.trim();
  return t === '' || t === '-' ? null : t;
}

export function rowToQs2026Payload(r: Record<string, string>): Qs2026RowPayload | null {
  const rankRaw = (r['Rank'] ?? '').trim();
  const qsRank = parseRankSortInt(rankRaw);
  const name = (r['Name'] ?? '').trim();
  const country = (r['Country/Territory'] ?? '').trim();
  if (qsRank == null || !name || !country) return null;

  const overallRaw = (r['Overall SCORE'] ?? '').trim();
  const qsOverall =
    overallRaw === '' || overallRaw === '-' ? null : toFloat(overallRaw, NaN);
  const qsOverallFinal = Number.isNaN(qsOverall as number) ? null : (qsOverall as number);

  const cc = countryNameToIso2(country);

  return {
    qs_rank: qsRank,
    previous_rank: emptyOr(r['Previous Rank'] ?? ''),
    name,
    country,
    country_code: cc,
    region: emptyOr(r['Region'] ?? ''),
    size: emptyOr(r['Size'] ?? ''),
    focus: emptyOr(r['Focus'] ?? ''),
    research_level: emptyOr(r['Research'] ?? ''),
    type: emptyOr(r['Status'] ?? ''),
    qs_overall_score: qsOverallFinal,
    ranking_year: 2026,
    academic_reputation: toFloat(r['AR SCORE'] ?? '', 0),
    employer_reputation: toFloat(r['ER SCORE'] ?? '', 0),
    faculty_student_ratio: toFloat(r['FSR SCORE'] ?? '', 0),
    citations_per_faculty: toFloat(r['CPF SCORE'] ?? '', 0),
    international_faculty: toFloat(r['IFR SCORE'] ?? '', 0),
    international_students: toFloat(r['ISR SCORE'] ?? '', 0),
    isd_score: num(r['ISD SCORE'] ?? '') ?? null,
    irn_score: num(r['IRN SCORE'] ?? '') ?? null,
    eo_score: num(r['EO SCORE'] ?? '') ?? null,
    sus_score: num(r['SUS SCORE'] ?? '') ?? null,
    ar_rank: emptyOr(r['AR RANK'] ?? ''),
    er_rank: emptyOr(r['ER RANK'] ?? ''),
    fsr_rank: emptyOr(r['FSR RANK'] ?? ''),
    cpf_rank: emptyOr(r['CPF RANK'] ?? ''),
    ifr_rank: emptyOr(r['IFR RANK'] ?? ''),
    isr_rank: emptyOr(r['ISR RANK'] ?? ''),
    isd_rank: emptyOr(r['ISD RANK'] ?? ''),
    irn_rank: emptyOr(r['IRN RANK'] ?? ''),
    eo_rank: emptyOr(r['EO RANK'] ?? ''),
    sus_rank: emptyOr(r['SUS RANK'] ?? ''),
  };
}
