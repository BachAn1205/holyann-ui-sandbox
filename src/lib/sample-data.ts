/**
 * Fictional records for the UI sandbox.
 * Names, emails, and schools below are invented. Do not replace them with production exports.
 */

export type SampleRow = Record<string, unknown>;

const HASH =
  "$2b$10$JKwAYeuIa4j43jrreHZ7CO41EXyD8LAc6JZP62T/hG601DXsgBWz2";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const MENTOR_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";

const UNIVERSITY_SEEDS = [
  { id: 1, qs_rank: 6, name: "Northwind University", country: "United States", country_code: "US", city: "Boston", region: "North America" },
  { id: 2, qs_rank: 14, name: "Lakeside Institute", country: "United Kingdom", country_code: "GB", city: "Oxford", region: "Europe" },
  { id: 3, qs_rank: 27, name: "Cedar College", country: "Australia", country_code: "AU", city: "Melbourne", region: "Oceania" },
  { id: 4, qs_rank: 9, name: "Harbor State University", country: "United States", country_code: "US", city: "Seattle", region: "North America" },
  { id: 5, qs_rank: 18, name: "Maple Ridge University", country: "Canada", country_code: "CA", city: "Toronto", region: "North America" },
  { id: 6, qs_rank: 12, name: "Thames College", country: "United Kingdom", country_code: "GB", city: "London", region: "Europe" },
  { id: 7, qs_rank: 22, name: "Alpine Technical University", country: "Germany", country_code: "DE", city: "Munich", region: "Europe" },
  { id: 8, qs_rank: 31, name: "Canal Institute", country: "Netherlands", country_code: "NL", city: "Delft", region: "Europe" },
  { id: 9, qs_rank: 11, name: "Orchard University", country: "Singapore", country_code: "SG", city: "Singapore", region: "Asia" },
  { id: 10, qs_rank: 16, name: "Fuji Institute", country: "Japan", country_code: "JP", city: "Tokyo", region: "Asia" },
  { id: 11, qs_rank: 21, name: "Han River University", country: "South Korea", country_code: "KR", city: "Seoul", region: "Asia" },
  { id: 12, qs_rank: 19, name: "Coral Coast University", country: "Australia", country_code: "AU", city: "Sydney", region: "Oceania" },
  { id: 13, qs_rank: 42, name: "Redwood Polytechnic", country: "United States", country_code: "US", city: "San Francisco", region: "North America" },
  { id: 14, qs_rank: 48, name: "Prairie College", country: "Canada", country_code: "CA", city: "Vancouver", region: "North America" },
  { id: 15, qs_rank: 36, name: "Lantern University", country: "United Kingdom", country_code: "GB", city: "Edinburgh", region: "Europe" },
  { id: 16, qs_rank: 201, name: "Lotus International University", country: "Vietnam", country_code: "VN", city: "Ho Chi Minh City", region: "Asia" },
  { id: 17, qs_rank: 29, name: "Seine School of Science", country: "France", country_code: "FR", city: "Paris", region: "Europe" },
  { id: 18, qs_rank: 320, name: "Mekong College", country: "Vietnam", country_code: "VN", city: "Hanoi", region: "Asia" },
] as const;

const UNIVERSITY_ROWS: SampleRow[] = UNIVERSITY_SEEDS.map((u) => ({
  ...u,
  status: "APPROVED",
  ranking_year: 2026,
  type: "Public",
  size: "L",
  focus: "CO",
  research_level: "VH",
  qs_overall_score: Math.max(42, 100 - u.qs_rank / 4),
  academic_reputation: Math.max(40, 96 - u.qs_rank / 5),
  employer_reputation: Math.max(38, 94 - u.qs_rank / 5),
  website_url: `https://example.com/uni-${u.id}`,
}));

const AREA_LABEL = {
  A: "Vùng A — Mỹ & Bắc Mỹ",
  B: "Vùng B — Châu Á",
  C: "Vùng C — EU / UK / Úc / Canada",
} as const;

function chanceRow(
  universityName: string,
  facultyName: string,
  delta: number,
  area: keyof typeof AREA_LABEL,
): SampleRow {
  const uni = UNIVERSITY_SEEDS.find((item) => item.name === universityName);
  return {
    university_name: universityName,
    faculty_name: facultyName,
    university_id: uni?.id ?? null,
    qs_rank: uni?.qs_rank ?? null,
    delta,
    feature1_area: area,
    feature1_area_label: AREA_LABEL[area],
  };
}

const LATEST_SUMMARY = {
  pillars: { academic: 78, language: 72, extracurricular: 66, skills: 74 },
  wishlist_counts: { faculties: 3, universities: 3 },
  student_score: 74,
  spike_score: 82,
};

const LATEST_FACULTIES = {
  reach: [
    chanceRow("Northwind University", "Computer Science", -18, "A"),
    chanceRow("Harbor State University", "Computer Science", -14, "A"),
    chanceRow("Thames College", "Data Science", -16, "C"),
    chanceRow("Orchard University", "Artificial Intelligence", -12, "B"),
    chanceRow("Fuji Institute", "Computer Science", -21, "B"),
    chanceRow("Seine School of Science", "Mathematics", -11, "C"),
  ],
  match: [
    chanceRow("Lakeside Institute", "Data Science", -2, "C"),
    chanceRow("Lakeside Institute", "Computer Science", 1, "C"),
    chanceRow("Maple Ridge University", "Computer Science", -3, "A"),
    chanceRow("Cedar College", "Software Engineering", 2, "C"),
    chanceRow("Han River University", "Data Science", -1, "B"),
    chanceRow("Alpine Technical University", "Electrical Engineering", 3, "C"),
    chanceRow("Coral Coast University", "Computer Science", 0, "C"),
    chanceRow("Canal Institute", "Artificial Intelligence", -4, "C"),
  ],
  safety: [
    chanceRow("Redwood Polytechnic", "Computer Science", 12, "A"),
    chanceRow("Prairie College", "Data Science", 15, "A"),
    chanceRow("Lantern University", "Business Administration", 9, "C"),
    chanceRow("Lotus International University", "Computer Science", 18, "B"),
    chanceRow("Mekong College", "Information Systems", 22, "B"),
    chanceRow("Cedar College", "Data Science", 8, "C"),
  ],
};

export const sampleStores: Record<string, SampleRow[]> = {
  users: [
    {
      id: STUDENT_ID,
      full_name: "Lan Demo",
      email: "student@demo.local",
      password_hash: HASH,
      phone_number: "0900000001",
      role: "STUDENT",
      auth_provider: "LOCAL",
      avatar_url: null,
      is_verified: true,
      is_active: true,
      subscription_plan: "PLUS",
      created_at: new Date("2026-01-01"),
    },
    {
      id: MENTOR_ID,
      full_name: "Minh Demo",
      email: "mentor@demo.local",
      password_hash: HASH,
      phone_number: "0900000002",
      role: "MENTOR",
      auth_provider: "LOCAL",
      avatar_url: null,
      is_verified: true,
      is_active: true,
      subscription_plan: null,
      created_at: new Date("2026-01-01"),
    },
    {
      id: ADMIN_ID,
      full_name: "Admin Demo",
      email: "admin@demo.local",
      password_hash: HASH,
      phone_number: "0900000003",
      role: "ADMIN",
      auth_provider: "LOCAL",
      avatar_url: null,
      is_verified: true,
      is_active: true,
      subscription_plan: null,
      created_at: new Date("2026-01-01"),
    },
  ],
  students: [
    {
      user_id: STUDENT_ID,
      current_school: "THPT Mau",
      current_grade: "12",
      current_address: "Quan 1, thanh pho mau",
      talents: "Thuyet trinh",
      hobbies: "Doc sach",
      yearly_budget: 20000,
      yearly_budget_currency: "USD",
      personal_desire: "Hoc khoa hoc may tinh o nuoc ngoai.",
      date_of_birth: new Date("2008-05-12"),
      target_faculty_name: "Computer Science",
      target_university_name: "Northwind University",
      assessments_completed: true,
      created_at: new Date("2026-01-02"),
      updated_at: new Date("2026-02-01"),
    },
  ],
  mentors: [
    {
      user_id: MENTOR_ID,
      mentor_type: "AS",
      bio: "Co van mau cho ban UI sandbox.",
    },
  ],
  university_rankings: UNIVERSITY_ROWS,
  universities: UNIVERSITY_ROWS.map((row) => ({
    id: row.id,
    name: row.name,
    country: row.country,
    current_ranking: row.qs_rank,
    website_url: row.website_url,
  })),
  school_wishlist: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      student_id: STUDENT_ID,
      university_id: 1,
      sort_order: 0,
      created_at: new Date("2026-02-02"),
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      student_id: STUDENT_ID,
      university_id: 2,
      sort_order: 1,
      created_at: new Date("2026-02-02"),
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
      student_id: STUDENT_ID,
      university_id: 9,
      sort_order: 2,
      created_at: new Date("2026-02-04"),
    },
  ],
  faculty_wishlist: [
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      student_id: STUDENT_ID,
      faculty_name: "Computer Science",
      sort_order: 0,
      created_at: new Date("2026-02-02"),
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      student_id: STUDENT_ID,
      faculty_name: "Data Science",
      sort_order: 1,
      created_at: new Date("2026-02-02"),
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
      student_id: STUDENT_ID,
      faculty_name: "Artificial Intelligence",
      sort_order: 2,
      created_at: new Date("2026-02-04"),
    },
  ],
  student_target_goals: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
      student_id: STUDENT_ID,
      faculty_name: "Computer Science",
      university_id: 1,
      university_name: "Northwind University",
      sort_order: 0,
      created_at: new Date("2026-02-03"),
    },
  ],
  marketing_posts: [
    {
      id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
      title: "Bai viet mau",
      slug: "bai-viet-mau",
      excerpt: "Noi dung mau cho giao dien.",
      status: "PUBLISHED",
      created_at: new Date("2026-03-01"),
    },
  ],
  major_faculty_catalog: [
    ["Computer Science", "Computing", 92],
    ["Data Science", "Computing", 88],
    ["Artificial Intelligence", "Computing", 90],
    ["Software Engineering", "Computing", 84],
    ["Information Systems", "Computing", 76],
    ["Cybersecurity", "Computing", 80],
    ["Mathematics", "Natural sciences", 74],
    ["Physics", "Natural sciences", 70],
    ["Electrical Engineering", "Engineering", 78],
    ["Mechanical Engineering", "Engineering", 72],
    ["Biotechnology", "Life sciences", 73],
    ["Medicine", "Life sciences", 69],
    ["Business Administration", "Business", 71],
    ["Economics", "Business", 75],
    ["Finance", "Business", 73],
    ["Psychology", "Social sciences", 68],
    ["International Relations", "Social sciences", 66],
    ["Architecture", "Design", 64],
    ["Graphic Design", "Design", 62],
    ["Environmental Science", "Natural sciences", 67],
  ].map(([occupation_name, industry_group, major_score], index) => ({
    id: index + 1,
    occupation_name,
    industry_group,
    occupation_code: `MAJ-${index + 1}`,
    major_score,
    job_zone: 4,
    status: "APPROVED",
    data_level: "SAMPLE",
    created_at: new Date("2026-01-15"),
  })),
  faculty_recommendations: [
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
      student_id: STUDENT_ID,
      assessment_summary: { mbti: "INTJ", riasec: "IRC" },
      faculties: [
        { faculty_name: "Computer Science", match_score: 94 },
        { faculty_name: "Artificial Intelligence", match_score: 91 },
        { faculty_name: "Data Science", match_score: 89 },
        { faculty_name: "Software Engineering", match_score: 84 },
        { faculty_name: "Mathematics", match_score: 78 },
        { faculty_name: "Electrical Engineering", match_score: 74 },
      ],
      created_at: new Date("2026-02-08"),
    },
  ],
  admission_chance_results: [
    {
      id: "ffffffff-ffff-4fff-8fff-fffffffffff1",
      student_id: STUDENT_ID,
      summary: LATEST_SUMMARY,
      faculties: LATEST_FACULTIES,
      created_at: new Date("2026-03-12T09:30:00"),
    },
    {
      id: "ffffffff-ffff-4fff-8fff-fffffffffff2",
      student_id: STUDENT_ID,
      summary: {
        pillars: { academic: 74, language: 68, extracurricular: 60, skills: 70 },
        wishlist_counts: { faculties: 2, universities: 2 },
        student_score: 69,
        spike_score: 76,
      },
      faculties: {
        reach: [
          chanceRow("Northwind University", "Computer Science", -22, "A"),
          chanceRow("Thames College", "Data Science", -19, "C"),
        ],
        match: [
          chanceRow("Lakeside Institute", "Computer Science", -1, "C"),
          chanceRow("Orchard University", "Data Science", 2, "B"),
        ],
        safety: [
          chanceRow("Lotus International University", "Computer Science", 16, "B"),
          chanceRow("Redwood Polytechnic", "Information Systems", 14, "A"),
        ],
      },
      created_at: new Date("2026-02-18T15:00:00"),
    },
  ],
  profile_analyses: [
    {
      id: "10101010-1010-4010-8010-101010101010",
      student_id: STUDENT_ID,
      score_aca: 78,
      score_lan: 72,
      score_hdnk: 66,
      score_skill: 74,
      suitability_a: 71,
      suitability_b: 84,
      suitability_c: 76,
      created_at: new Date("2026-02-12"),
      updated_at: new Date("2026-02-12"),
      input_data: {},
      areas: {},
      swot_data: {},
      full_result: {
        pillar_scores: { academic: 78, language: 72, extracurricular: 66, skills: 74 },
        spikes: [
          {
            type: "academic",
            type_vi: "Học thuật",
            tier: "high",
            tier_vi: "Cao",
            evidence: "GPA ổn định và giải tin học cấp thành phố.",
            score: 82,
            comment: "Điểm mạnh rõ ở toán và tin.",
          },
        ],
        areas: {
          A: {
            name: "Mỹ (US / North America)",
            score: { academic: 76, language: 70, extracurricular: 62, skills: 74 },
            suitability: 71,
            suitability_level: "medium",
            reason: "Hồ sơ học thuật đủ để nhắm nhóm Match, ngoại khóa còn mỏng so với hồ sơ Mỹ.",
          },
          B: {
            name: "Châu Á",
            score: { academic: 80, language: 72, extracurricular: 66, skills: 75 },
            suitability: 84,
            suitability_level: "high",
            reason: "Phù hợp nhóm trường châu Á nhờ điểm học thuật và định hướng Computer Science.",
          },
          C: {
            name: "Châu Âu / Anh / Úc / Canada",
            score: { academic: 78, language: 74, extracurricular: 64, skills: 73 },
            suitability: 76,
            suitability_level: "medium",
            reason: "IELTS 7.0 mở được nhóm Match tại Anh, Úc và Canada.",
          },
        },
        swot: {
          S: ["GPA lớp 12 ở mức 8.8", "IELTS 7.0", "Có dự án lập trình cá nhân"],
          W: ["Hoạt động ngoại khóa còn ít vai trò dẫn dắt", "Chưa có giải quốc gia"],
          O: ["Ngành Computer Science đang có nhiều nguyện vọng phù hợp", "Có thể bổ sung nghiên cứu ngắn"],
          T: ["Nhóm Reach tại Mỹ cạnh tranh cao", "Hạn nộp sớm hơn kế hoạch hiện tại"],
        },
      },
    },
  ],
  student_backgrounds: [
    {
      student_id: STUDENT_ID,
      created_at: new Date("2026-01-02"),
      updated_at: new Date("2026-02-01"),
      experiments: ["Câu lạc bộ robotics"],
    },
  ],
  student_academic_profiles: [
    {
      student_id: STUDENT_ID,
      gpa_transcript_details: {
        grade9: "8.4",
        grade10: "8.6",
        grade11: "8.7",
        grade12: "8.8",
      },
      english_certificates: [{ type: "IELTS", score: "7.0", level: "C1" }],
      standardized_tests: [{ name: "SAT", value: 1380, max_value: 1600 }],
      updated_at: new Date("2026-02-01"),
    },
  ],
  subject_scores: [
    { id: "12121212-1212-4212-8212-121212121211", background_id: STUDENT_ID, subject: "Toán", score: 9.2, group: "natural", year: 2026 },
    { id: "12121212-1212-4212-8212-121212121212", background_id: STUDENT_ID, subject: "Tin học", score: 9.4, group: "natural", year: 2026 },
    { id: "12121212-1212-4212-8212-121212121213", background_id: STUDENT_ID, subject: "Vật lý", score: 8.6, group: "natural", year: 2026 },
    { id: "12121212-1212-4212-8212-121212121214", background_id: STUDENT_ID, subject: "Tiếng Anh", score: 8.5, group: "language", year: 2026 },
  ],
  academic_awards: [
    {
      id: "13131313-1313-4313-8313-131313131311",
      background_id: STUDENT_ID,
      award_name: "Giải nhì tin học thành phố",
      issuing_organization: "Sở Giáo dục mẫu",
      award_level: "Thành phố",
      category: "academic",
      rank: 2,
      year: 2025,
      award_date: new Date("2025-12-10"),
    },
  ],
  academic_extracurriculars: [
    {
      id: "14141414-1414-4414-8414-141414141411",
      background_id: STUDENT_ID,
      activity_name: "Câu lạc bộ lập trình",
      organization: "THPT Mau",
      role: "Thành viên chủ chốt",
      start_date: new Date("2024-09-01"),
      is_current: true,
    },
  ],
  personal_projects: [
    {
      id: "15151515-1515-4515-8515-151515151511",
      background_id: STUDENT_ID,
      project_name: "Ứng dụng ôn tập môn Toán",
      description: "Dự án cá nhân bằng Python cho học sinh lớp 12.",
      start_date: new Date("2025-06-01"),
      end_date: new Date("2025-11-01"),
    },
  ],
  student_skills: [
    { id: "16161616-1616-4616-8616-161616161611", student_id: STUDENT_ID, skill_name: "Python", proficiency: "Khá", category: "hard" },
    { id: "16161616-1616-4616-8616-161616161612", student_id: STUDENT_ID, skill_name: "Thuyết trình", proficiency: "Khá", category: "soft" },
  ],
  student_parents: [
    {
      id: "17171717-1717-4717-8717-171717171711",
      student_id: STUDENT_ID,
      full_name: "Hoa Demo",
      relationship: "Mẹ",
      phone_number: "0900000011",
      email: "parent@demo.local",
      job_title: "Kế toán",
    },
  ],
  checklist_stages: [
    { id: 1, name: "Chuẩn bị hồ sơ", description: "Hoàn thiện giấy tờ nền", order_index: 1, is_default: true },
    { id: 2, name: "Nộp hồ sơ", description: "Nộp theo hạn từng trường", order_index: 2, is_default: true },
  ],
  checklist_tasks: [
    {
      id: "18181818-1818-4818-8818-181818181811",
      stage_id: 1,
      title: "Hoàn thiện bảng điểm song ngữ",
      description: "Xin bản dịch công chứng bảng điểm lớp 10–12.",
      order_index: 1,
      is_required: true,
      task_type: "document",
    },
    {
      id: "18181818-1818-4818-8818-181818181812",
      stage_id: 1,
      title: "Xin thư giới thiệu",
      description: "Nhờ giáo viên bộ môn Toán và Tin viết thư.",
      order_index: 2,
      is_required: true,
      task_type: "document",
    },
    {
      id: "18181818-1818-4818-8818-181818181813",
      stage_id: 2,
      title: "Nộp đơn Northwind University",
      description: "Nộp hồ sơ Computer Science vòng sớm.",
      order_index: 1,
      is_required: true,
      task_type: "application",
    },
  ],
  student_task_progress: [
    {
      id: "19191919-1919-4919-8919-191919191911",
      student_id: STUDENT_ID,
      task_id: "18181818-1818-4818-8818-181818181811",
      status: "IN_PROGRESS",
      deadline: new Date("2026-11-15"),
      created_at: new Date("2026-03-01"),
      updated_at: new Date("2026-03-01"),
    },
    {
      id: "19191919-1919-4919-8919-191919191912",
      student_id: STUDENT_ID,
      task_id: "18181818-1818-4818-8818-181818181812",
      status: "PENDING",
      deadline: new Date("2026-11-30"),
      created_at: new Date("2026-03-01"),
      updated_at: new Date("2026-03-01"),
    },
    {
      id: "19191919-1919-4919-8919-191919191913",
      student_id: STUDENT_ID,
      task_id: "18181818-1818-4818-8818-181818181813",
      status: "PENDING",
      deadline: new Date("2026-12-20"),
      created_at: new Date("2026-03-01"),
      updated_at: new Date("2026-03-01"),
    },
  ],
};
