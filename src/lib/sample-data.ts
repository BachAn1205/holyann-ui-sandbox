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
  university_rankings: [
    {
      id: 1,
      qs_rank: 1,
      name: "Northwind University",
      country: "Fictional",
      country_code: "XX",
      city: "Sample City",
      region: "Sample",
    },
    {
      id: 2,
      qs_rank: 2,
      name: "Lakeside Institute",
      country: "Fictional",
      country_code: "XX",
      city: "Harbor",
      region: "Sample",
    },
    {
      id: 3,
      qs_rank: 3,
      name: "Cedar College",
      country: "Fictional",
      country_code: "XX",
      city: "Cedar",
      region: "Sample",
    },
  ],
  universities: [
    {
      id: 1,
      name: "Northwind University",
      country: "Fictional",
      current_ranking: 1,
      website_url: "https://example.com/northwind",
    },
    {
      id: 2,
      name: "Lakeside Institute",
      country: "Fictional",
      current_ranking: 2,
      website_url: "https://example.com/lakeside",
    },
    {
      id: 3,
      name: "Cedar College",
      country: "Fictional",
      current_ranking: 3,
      website_url: "https://example.com/cedar",
    },
  ],
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
};
