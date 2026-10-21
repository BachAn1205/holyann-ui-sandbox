# Holyann Explore — Ứng dụng Hướng nghiệp & Du học

## Tổng quan

Holyann Explore là ứng dụng web (Next.js) dành cho học sinh, Cố vấn và quản trị viên với các luồng: **Student**, **Cố vấn**, **Admin** và trang **Pricing**. Đăng nhập xong redirect theo role: Student → `/student/dashboard`, Cố vấn → `/mentor/dashboard`, Admin → `/admin/dashboard` (qua trang trung gian `/dashboard`).

---

## Cấu trúc thư mục

```
hoex/
├── public/                 # Static assets (logo, images)
├── src/
│   ├── actions/            # Server actions (admin, calendar, support...)
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page (/)
│   │   ├── globals.css
│   │   ├── dashboard/      # Redirect theo role → student/mentor/admin dashboard
│   │   │   └── page.tsx
│   │   ├── api/            # API routes (auth, student, mentor, admin, chat...)
│   │   ├── (auth)/         # Route group: không ảnh hưởng URL
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (student)/      # Route group Student
│   │   │   ├── layout.tsx  # Layout + StudentNavbar
│   │   │   └── student/    # URL base: /student
│   │   │       ├── dashboard/
│   │   │       ├── profile/
│   │   │       ├── profile-analysis/
│   │   │       ├── target/
│   │   │       ├── tests/
│   │   │       ├── improve/
│   │   │       ├── universities/
│   │   │       ├── reports/
│   │   │       ├── pricing/
│   │   │       ├── checklist/
│   │   │       ├── deadlines/
│   │   │       ├── chat/
│   │   │       ├── settings/
│   │   │       └── ...
│   │   ├── (mentor)/       # Route group Mentor
│   │   │   ├── layout.tsx
│   │   │   └── mentor/     # URL base: /mentor
│   │   │       ├── dashboard/
│   │   │       ├── students/
│   │   │       ├── deadlines/
│   │   │       ├── profile/
│   │   │       └── chat/
│   │   └── (admin)/        # Route group Admin
│   │       ├── layout.tsx
│   │       └── admin/      # URL base: /admin
│   │           ├── dashboard/
│   │           ├── users/
│   │           ├── students/
│   │           ├── mentors/
│   │           ├── guests/
│   │           ├── university-rankings/
│   │           ├── feedback/
│   │           └── settings/
│   ├── components/
│   │   ├── admin/          # AdminNavbar, UserManagement, MentorManagement, dashboard...
│   │   ├── auth/           # Login, Register, RoleGuard, AuthProvider
│   │   ├── chat/           # ChatPage, MessageBubble, ConversationList, info-panel...
│   │   ├── common/         # FilePreviewModal, DocViewerWrapper
│   │   ├── dashboard/      # AuthHeader, Register (dashboard), Login, Loading
│   │   ├── landing/        # HeroSection, AboutSection, ServicesSection, LeadGenerationModal...
│   │   ├── layout/         # Header, Footer (landing)
│   │   ├── meetings/       # CreateMeetingModal, CreateReminderModal
│   │   ├── mentor/         # MentorNavbar, dashboard, student (tabs), deadlines
│   │   ├── student/        # StudentNavbar, dashboard, profile, checklist, assessments...
│   │   ├── support/        # FloatingHelpButton
│   │   ├── theme/          # ThemeToggle, ThemeScript
│   │   ├── ui/             # Button, Card, Input, Dialog, Tabs, Table...
│   │   └── ...
│   ├── constants/          # App constants
│   ├── data/               # student-nav-features, mbti-questions...
│   ├── hooks/              # useAuthSession, useSubscription...
│   ├── lib/                # Prisma, auth, subscription, utils, services
│   │   ├── auth/           # auth-config, get-user, api-auth
│   │   ├── services/       # auth.service, jwt.service, database.service
│   │   ├── utils/          # api-response, validation, rate-limit, redirect
│   │   └── ...
│   ├── services/           # AI (geminiService), database (profile-analyzer)
│   ├── types/              # TypeScript types (admin, auth...)
│   └── utils/              # Client-side helpers
├── package.json
├── next.config.ts
├── prisma.config.ts
└── README.md
```

**Ghi chú route groups:** Trong App Router, `(student)`, `(mentor)`, `(admin)`, `(auth)` là **route groups** — tên trong ngoặc không xuất hiện trên URL. Ví dụ: `app/(student)/student/dashboard/page.tsx` → URL là `/student/dashboard`.

---

## 1. Student Navbar

**Base path:** `/student`  
**Component:** `src/components/student/StudentNavbar.tsx`  
**Layout:** `src/app/(student)/layout.tsx`  
**Badge:** HỌC VIÊN

### Menu chính (nav chính)

| Tên           | Đường dẫn              | Mô tả                |
|---------------|-------------------------|----------------------|
| Tổng quan     | `/student/dashboard`    | Dashboard học viên   |
| Hồ sơ         | `/student/profile`      | Hồ sơ cá nhân        |
| Trắc nghiệm ngành | `/student/tests`    | Trắc nghiệm chọn ngành |
| Cải thiện hồ sơ | `/student/improve`   | Enhance hồ sơ, CV, essay |

### Dropdown user — Tính năng chính (mainFeatures)

| Tên                 | Đường dẫn                    | Mô tả                                      |
|---------------------|------------------------------|--------------------------------------------|
| Phân tích hồ sơ     | `/student/profile-analysis`  | Phân tích điểm mạnh – điểm yếu hồ sơ       |
| Trắc nghiệm ngành   | `/student/tests`             | Khám phá ngành học phù hợp                 |
| Ngành & Trường phù hợp | `/student/target`         | Reach / Match / Safe                       |
| Cải thiện hồ sơ     | `/student/improve`           | Enhance & phân tích hồ sơ, CV, essay       |
| Danh sách trường    | `/student/universities`      | Khám phá các trường đại học                |
| Báo cáo             | `/student/reports`           | Báo cáo tiến độ và kết quả                 |

### Dropdown user — Premium (premiumFeatures)

Cần gói trả phí; nếu chưa có subscription thì link dẫn về `/student/pricing`.

| Tên               | Đường dẫn            | Mô tả                          |
|-------------------|------------------------|--------------------------------|
| Chat với Cố vấn   | `/student/chat`        | Trao đổi với Cố vấn và Holie Mate |
| Tiến độ           | `/student/checklist`   | Theo dõi tiến độ công việc     |
| Hạn chót          | `/student/deadlines`   | Hạn nộp hồ sơ, mốc quan trọng  |
| Đặt lịch Cố vấn   | `/student/meeting`     | Đặt lịch gặp 1-1 với Cố vấn    |

### User menu khác

- **Cài đặt:** `/student/settings`
- **Pricing:** `/student/pricing` (trang gói đăng ký)
- Chế độ sáng/tối, Đăng xuất

---

## 2. Cố vấn Navbar

**Base path:** `/mentor`  
**Component:** `src/components/mentor/MentorNavbar.tsx`  
**Layout:** `src/app/(mentor)/layout.tsx`  
**Badge:** Cố vấn

### Menu chính

| Tên       | Đường dẫn             | Mô tả              |
|-----------|------------------------|--------------------|
| Tổng quan | `/mentor/dashboard`    | Dashboard Cố vấn   |
| Học viên  | `/mentor/students`     | Quản lý học viên   |
| Hạn chót  | `/mentor/deadlines`   | Theo dõi hạn chót  |
| Hồ sơ     | `/mentor/profile`     | Hồ sơ Cố vấn       |
| Trao đổi  | `/mentor/chat`        | Chat với học viên  |

### User dropdown

- Hồ sơ: `/mentor/profile`
- Chế độ sáng/tối
- Đăng xuất

---

## 3. Admin Navbar

**Base path:** `/admin`  
**Component:** `src/components/admin/AdminNavbar.tsx`  
**Layout:** `src/app/(admin)/layout.tsx`  
**Badge:** QUẢN TRỊ

### Menu chính

| Tên       | Đường dẫn                | Mô tả           |
|-----------|---------------------------|-----------------|
| Tổng quan | `/admin/dashboard`        | Dashboard admin |
| Người dùng| `/admin/users`            | Quản lý user    |
| Học viên  | `/admin/students`         | Quản lý học viên|
| Cố vấn    | `/admin/mentors`          | Quản lý Cố vấn  |
| Guests    | `/admin/guests`           | Quản lý khách   |

### User dropdown (menu phụ)

| Tên            | Đường dẫn                     |
|----------------|--------------------------------|
| Xếp hạng trường| `/admin/university-rankings`   |
| Feedback       | `/admin/feedback`              |
| Cài đặt        | `/admin/settings`              |
| Chế độ sáng/tối, Đăng xuất | —                    |

---

## 4. Đăng nhập & Redirect

- **Landing:** `/` (trang chủ). Nút "Khám phá ngay" → `/login`.
- **Login:** `/login` (credentials + Google). Sau khi đăng nhập thành công → `/dashboard`.
- **Trang `/dashboard`:** `src/app/dashboard/page.tsx` — đọc session, redirect theo role:
  - **ADMIN** → `/admin/dashboard`
  - **MENTOR** → `/mentor/dashboard`
  - **STUDENT / user** → `/student/dashboard`
  - Chưa đăng nhập → `/login`.

---

## 5. Pricing Page

**Đường dẫn:** `/student/pricing`  
**File:** `src/app/(student)/student/pricing/page.tsx`  
**Guard:** Chỉ role `user` / `student` / `STUDENT`.

### Mục đích

Trang gói đăng ký Holyann cho học sinh: so sánh Free, Plus (Holie Mate), Premium (Holie Mate + All Advisors) và thực hiện nâng cấp / liên hệ bán hàng.

### Gói hiển thị

| Gói      | Tên hiển thị                    | Giá (Plus)     | Ghi chú                    |
|----------|----------------------------------|----------------|----------------------------|
| **FREE** | Free                             | 0đ             | Dùng thử, 1 lần/module Holie Mate  |
| **PLUS** | Plus (Holie Mate)                | 399.000đ/6 tháng hoặc 599.000đ/năm | Phổ biến, mở khóa chi tiết Holie Mate |
| **PREMIUM** | Premium (Holie Mate + All Advisors)  | Liên hệ        | Tốt nhất, CTA "Liên hệ bán hàng" |

- **Chu kỳ thanh toán:** Tabs 6 tháng / 1 năm (chỉ áp dụng cho Plus).
- **Premium:** Nút "Liên hệ bán hàng" → `mailto:sales@holyann.com?subject=Đăng ký gói Premium`.
- Nâng cấp Plus: gọi `POST /api/subscription/upgrade` với `{ plan, billingCycle }`.

### Bảng so sánh (8 Feature Holie Mate)

Trang có bảng so sánh chi tiết theo cột **Free | Plus | Premium** cho:

1. **Feature 1 — Profile Analysis:** Phân tích profile gốc (số lần, mức độ chi tiết).
2. **Feature 2 — Major Detector:** Số lần làm, số ngành hiển thị, % mờ/đầy đủ.
3. **Feature 3 — Target Detector:** Phân tích list trường phù hợp (Reach/Match/Safe); Số lần dùng, số ngành/trường, major fit %, match score, roadmap.
4. **Feature 4 — Essay Enhance & Re-analysis:** enhance + analysis bài luận (số lần / không giới hạn).
5. **Feature 5 — School List:** Hiển thị danh sách trường (miễn phí cho mọi gói).
6. **Feature 6 — Reports:** Báo cáo PDF/in (1 lần Free, không giới hạn Plus/Premium).
7. **Feature 7 — Cv Enhance & Re-analysis:** enhance + analysis (số lần / không giới hạn).
8. **Feature 8 — Interview Practice:** Mô phỏng phỏng vấn sử dụng Holie Mate để đánh giá (updating)

---

## Tóm tắt file quan trọng

| Mục đích           | Đường dẫn |
|--------------------|-----------|
| Redirect theo role | `src/app/dashboard/page.tsx` |
| Landing            | `src/app/page.tsx` |
| Auth config        | `src/lib/auth/auth-config.ts` |
| Student layout     | `src/app/(student)/layout.tsx` |
| Mentor layout      | `src/app/(mentor)/layout.tsx` |
| Admin layout       | `src/app/(admin)/layout.tsx` |
| Student navbar     | `src/components/student/StudentNavbar.tsx` |
| Mentor navbar      | `src/components/mentor/MentorNavbar.tsx` |
| Admin navbar       | `src/components/admin/AdminNavbar.tsx` |
| Menu student       | `src/data/student-nav-features.ts` |
| Pricing page       | `src/app/(student)/student/pricing/page.tsx` |
