# Holyann Explore — Design System (hiện trạng codebase)

Tài liệu mô tả **hệ thống thiết kế đang được dùng thực tế** trong repo `holyann-ai-web` (Next.js App Router). Cập nhật theo snapshot: `globals.css`, `components.json`, layout theo role, và subsystem **Calm Admission Dossier** (trang hồ sơ học sinh).

---

## 1. Tổng quan thương hiệu

| Khía cạnh | Mô tả |
|-----------|--------|
| **Tên sản phẩm** | Holyann Explore (Holie Mate — hướng nghiệp & du học) |
| **Ngôn ngữ UI** | Tiếng Việt (`lang="vi"`) |
| **Tông thương hiệu** | Navy tin cậy + cyan năng động + amber cho CTA/premium |
| **Màu nhận diện chính** | `#0f4c81` (Holyann navy) |
| **Đối tượng** | Học sinh, Cố vấn (mentor), Admin, Marketing/Landing |

---

## 2. Nền tảng kỹ thuật UI

| Thành phần | Chi tiết |
|------------|----------|
| **Framework** | Next.js (React), App Router |
| **CSS** | Tailwind CSS v4 (`@import "tailwindcss"`), `tw-animate-css` |
| **Component library** | [shadcn/ui](https://ui.shadcn.com) — style **new-york**, `baseColor: neutral`, **CSS variables** |
| **Primitives** | Radix UI (Dialog, Select, Tabs, Toast, Slot, …) |
| **Icons** | **Lucide React** (ưu tiên trong app); Font Awesome 6.4 (CDN, landing/legacy) |
| **Animation** | Framer Motion (landing headings, dashboard cards, …) |
| **Toast** | Sonner + Radix Toast (`ToasterProvider`) |
| **Forms** | react-hook-form + zod (`@hookform/resolvers`) |
| **Utility** | `cn()` — `@/lib/utils` (clsx + tailwind-merge) |
| **Dark mode** | Class `.dark` trên `<html>` (`@custom-variant dark (&:is(.dark *))`) |

**Nguồn token chính:** `src/app/globals.css`  
**Alias import UI:** `@/components/ui/*` (xem `components.json`)

---

## 3. Màu sắc (design tokens)

### 3.1 Semantic tokens (shadcn / Tailwind `@theme`)

Ánh xạ trong `@theme inline` → dùng class Tailwind: `bg-background`, `text-foreground`, `bg-primary`, `border-border`, v.v.

#### Light (`:root`)

| Token | Giá trị | Vai trò |
|-------|---------|---------|
| `--background` | `#ffffff` | Nền trang |
| `--surface` | `#f8fafc` | Nền phụ / lớp |
| `--surface-elevated` | `#ffffff` | Card nổi |
| `--foreground` | `#0f172a` | Chữ chính (slate-900) |
| `--primary` | `#0f4c81` | **Brand navy** — CTA, heading, ring |
| `--primary-foreground` | `#ffffff` | Chữ trên primary |
| `--secondary` | `#00b4db` | Cyan phụ |
| `--secondary-foreground` | `#ffffff` | |
| `--accent` | `#f5a623` | **Amber CTA** / premium highlight |
| `--accent-foreground` | `#ffffff` | |
| `--muted` | `#f1f5f9` | Nền muted |
| `--muted-foreground` | `#64748b` | Chữ phụ |
| `--destructive` | `#ef4444` | Lỗi / xóa |
| `--border` / `--input` | `#e2e8f0` | Viền, input |
| `--ring` | `#0f4c81` | Focus ring |
| `--radius` | `0.625rem` (10px) | Bo góc base shadcn |

#### Dark (`.dark`)

| Token | Giá trị | Ghi chú |
|-------|---------|---------|
| `--background` | `#0c1222` | Navy đen |
| `--surface` | `#131c2e` | |
| `--surface-elevated` / `--card` | `#1a2742` | Panel/card |
| `--foreground` | `#f1f5f9` | |
| `--primary` | `#38bdf8` | Sky — primary sáng trên nền tối |
| `--primary-foreground` | `#0c1222` | |
| `--secondary` | `#1e293b` | |
| `--accent` | `#f5a623` | Giữ amber |
| `--border` | `#334155` | |
| `--ring` | `#38bdf8` | |

**Radius derived:** `--radius-sm`, `--radius-md`, `--radius-lg` (tính từ `--radius`).

### 3.2 Brand helpers (CSS custom, không map sẵn sang Tailwind theme)

| Variable | Light usage | Mô tả |
|----------|-------------|--------|
| `--brand-cyan` | `#00c6ff` | Gradient, text gradient |
| `--brand-blue` | `#0072ff` | Link landing, gradient |
| `--brand-deep` | `#0f6093` | Navbar gradient giữa |
| `--brand-deep-darker` | `#0a4b75` | Dark navbar |
| `--brand-gradient2` | `#2b8cc9` | |
| `--accent-alt` | `#f59e0b` | Trong `BRAND_COLORS` JS |
| `--footer-bg` | `#0f172a` | Footer tối |

### 3.3 Màu domain (assessment / grit / báo cáo)

| Variable / constant | Màu | Ngữ cảnh |
|---------------------|-----|----------|
| `--grit-perseverance` | `#8b5cf6` | Grit Scale UI |
| `--grit-consistency` | `#ec4899` | |
| `--grit-strong` | `#9333ea` | |
| `MATCH_COLOR` (reports) | `#10b981` | Nhóm trường MATCH |
| REACH / SAFETY | Hard-coded trong từng màn | Phân loại DREAM–MATCH–SAFETY |

### 3.4 Gradient chuẩn (marketing & nav)

```text
Primary CTA / navbar (student):
  from-[var(--primary)] via-[var(--brand-deep)] to-[var(--brand-cyan)]

Dark navbar variant:
  from-[var(--secondary)] via-[var(--brand-deep-darker)] to-[var(--primary)]

Text / button gradient (globals + data.ts):
  from-[var(--primary)] to-[var(--brand-cyan)]
  from-[var(--brand-cyan)] to-[var(--brand-blue)]   ← BRAND_COLORS.primaryGradient

Section title underline:
  bg-[var(--secondary)] (light) / bg-[var(--accent)] (dark)
```

### 3.5 `color-mix` (profile dossier & cards)

Nhiều viền/nền dùng `color-mix(in srgb, #0f4c81 N%, transparent)` hoặc `#e2e8f0` — pattern **tint navy** thay vì gray thuần.

---

## 4. Typography

### 4.1 Role tokens (chốt Hướng 3 · Lexend + Nunito)

| Role | Tailwind / CSS | Font |
|------|----------------|------|
| Body / UI | `--font-sans` | **Lexend** (`--font-lexend`) |
| Headings | `--font-heading` | **Nunito** (`--font-nunito`) |
| App chrome (nav/shell) | `--font-university-sans` | **Lexend** |
| Decorative / hero | `--font-display` | Playfair Display |
| Badge serif | `--font-noto-serif-display` | Noto Serif Display |
| Essay | `--font-essay` | Georgia / Times |

**Body defaults:** `15px`, `line-height: 1.6`, `letter-spacing: -0.01em`, antialiased.

**Heading scale (global):**

- h1: `clamp(1.875rem, 4vw, 3rem)`, weight 800  
- h2: `clamp(1.5rem, 3vw, 2.25rem)`, weight 700  
- h3: `clamp(1.25rem, 2.5vw, 1.75rem)`, weight 700  
- h4: `1.125rem`, weight 600  
- Màu: `text-primary` (light), `dark:text-foreground`

### 4.2 Fonts load ở root (`src/app/layout.tsx`)

| Variable | Font Google | Subset | Dùng cho |
|----------|-------------|--------|----------|
| `--font-lexend` | Lexend | latin + **vietnamese** | Body, UI, navbar shells |
| `--font-nunito` | Nunito | latin + vietnamese | Headings |
| `--font-playfair` | Playfair Display | latin | Display / hero |
| `--font-noto-serif-display` | Noto Serif Display | latin + vietnamese | Badge serif |

### 4.3 Utility classes font

| Class | Stack |
|-------|--------|
| `.font-university-sans` | Lexend — student/mentor/admin/marketing shells |
| `.font-university-display` | Playfair |
| `.font-display` | Playfair |
| `.font-essay` | Georgia |
| `.font-serif-display` | Noto Serif Display, weight 600 |
| `.font-heading` | Nunito |
| `.font-sans` | Lexend |
| `.nav-link` | university-sans, 14px, medium |
| `.badge-hoex` | university-sans, 0.65rem, uppercase, tracking 0.08em |

### 4.4 Profile dossier typography (scoped)

Trong `.profile-creative-root`:

| Class | Mục đích |
|-------|----------|
| `.pc-display` | Tiêu đề panel — Nunito (`--font-heading`) |
| `.pc-mono-caps` | Nhãn section — 11px, uppercase, muted |
| `.pc-read-sans` | Body trong scope — Lexend |
| `.pc-rank-num` | Số thứ tự nguyện vọng — tabular-nums, navy / sky dark |

---

## 5. Layout theo vai trò (app shells)

| Route group | Wrapper | Nền / font |
|-------------|---------|------------|
| **Root** | `body`: token + `antialiased font-sans` | ThemeProvider |
| **Landing** `/` | `.landing-light` — **luôn palette light** kể cả khi `html.dark` | `font-sans`, slate text |
| **Student** `(student)/layout` | `bg-slate-50`, `font-university-sans`, full height | StudentNavbar |
| **Mentor / Admin / Marketing** | `bg-background`, `font-university-sans` | Navbar riêng |
| **Auth** | `bg-background`, `dark:auth-page-grid` | Grid mờ dark |
| **Profile** `/student/profile` | `.profile-creative-root` + `profile-creative.css` | Calm Admission Dossier |

**Landing exception:** `html.dark .landing-light { … }` ghi đè token về light cho marketing.

---

## 6. Component patterns toàn cục (`globals.css` @layer components)

| Class | Mô tả |
|-------|--------|
| `.navbar-header` | Glass tối legacy: blur, border trắng mờ |
| `.text-gradient` | Gradient primary → brand-cyan, clip text |
| `.btn-holyann` | CTA: university-sans, gradient, `rounded-xl`, shadow, hover lift |
| `.section-title` | Nunito heading, uppercase center, gạch dưới secondary/accent |
| `.card-holyann` | `rounded-2xl`, border, shadow-sm → md on hover |
| `.modal-overlay` | Fixed fullscreen, `var(--overlay)` |
| `.hero-grid-bg` / `.hero-rays` | Grid + radial navy (light) / sky (dark) |
| `.reports-print-scope` | In PDF: force light, tắt shadow |

---

## 7. shadcn/ui — Button & Card (mặc định app)

**Button** (`src/components/ui/button.tsx`):

- Base: `rounded-md`, focus ring `ring-ring/50`, sizes `xs` → `lg`, icon variants
- Variants: `default` (primary), `destructive`, `outline`, `secondary`, `ghost`, `link`

**Card**:

- `rounded-lg border bg-card shadow-sm`
- Header/Content padding `p-6`

**Form controls:** Input, Select, Checkbox, Dialog, Tabs, Table, Popover, Calendar — theo token semantic, bo góc chủ yếu **`rounded-md`** (khác với marketing `rounded-full` / dossier `1rem`).

---

## 8. Subsystem: Calm Admission Dossier (Hồ sơ học sinh)

**Scope:** `.profile-creative-root` — `src/app/(student)/student/profile/layout.tsx`  
**CSS:** `src/app/(student)/student/profile/profile-creative.css`

### 8.1 Local tokens (`--pc-*`)

| Token | Giá trị (light) |
|-------|------------------|
| `--pc-primary` | `#0f4c81` |
| `--pc-accent` | `#0072ff` |
| `--pc-cyan` | `#00c6ff` |
| `--pc-success` / `--pc-warning` / `--pc-danger` | green / amber / red |
| `--pc-mist` | `#f4f7fb` | Page background |
| `--pc-radius` | `1rem` |
| `--pc-border` | color-mix navy 12% + slate border |
| `--pc-shadow` | Soft elevation (navy tint) |

### 8.2 Primitives

| Class | Dùng cho |
|-------|----------|
| `.profile-creative-page-bg` | Nền trang + radial gradients |
| `.pc-panel` | Card bento (border, radius 1rem, shadow) |
| `.pc-panel-header` | Header panel, tint primary 4% |
| `.pc-hero-surface` | Identity rail — gradient nhẹ |
| `.pc-chip-primary` / `.pc-chip-ghost` | Chip trạng thái |
| `.pc-rank-row` | Hàng xếp hạng nguyện vọng trường/ngành |
| `.pc-sticker-shadow` | Alias shadow dossier |

### 8.3 Layout profile (React)

- **Hàng 1:** grid 12 cột — Cá nhân | Nguyện vọng ngành | Nguyện vọng trường (`lg:col-span-4` mỗi cột), `items-start`
- **Hàng 2+:** `ProfileCollapsibleSection` — accordion mặc định đóng, summary một dòng
- **Wishlist embedded:** top **5** + link «Quản lý danh sách»
- **Màu inline phổ biến:** `#0f4c81`, dark: `sky-300` / `#38bdf8`, icon box `color-mix(...#0f4c81_8%...)`

---

## 9. Navigation & marketing (pattern riêng)

### 9.1 Landing Header (`components/layout/Header.tsx`)

- Fixed, `bg-white`, `border-slate-100`, logo PNG
- Nav: uppercase, bold, `text-slate-700`, hover `var(--brand-blue)`
- CTA: `rounded-full`, gradient `BRAND_COLORS.primaryGradient`, shadow-lg

### 9.2 StudentNavbar

- Full-width bar: **gradient navy → deep → cyan** (dark variant khác)
- Nav pills: `rounded-full`, active `bg-white/20 ring-white/25`
- Dropdown: `rounded-xl`, border cyan tint, shadow-2xl
- Premium: accent amber `border-accent/30 bg-accent/10`
- Breakpoint desktop nav: `xl` (mobile hamburger)

### 9.3 Marketing motion

- `SectionHeading`: Framer Motion fade, gradient headline blue→cyan
- `QuickStatCard`: motion + accent border-left theo loại stat

---

## 10. Theme & chế độ sáng/tối

| Cơ chế | Hành vi hiện tại |
|--------|------------------|
| `ThemeProvider` | Hỗ trợ `light` / `dark` / `system` trong code |
| `ThemeScript` | **Ép `light`** khi load (ghi localStorage `theme=light`) |
| Toggle UI | Có thể tồn tại nhưng script root ưu tiên light ban đầu |
| Landing | Luôn light qua `.landing-light` |
| Student layout | `bg-slate-50` (light-leaning shell) |

Transition: `transition-colors duration-300` trên `html`, `body`.

---

## 11. Iconography

| Nguồn | Khi dùng |
|-------|----------|
| **Lucide** | Navbar, profile, forms, shadcn (size 14–16 typ., `size-4` default) |
| **Font Awesome** | CDN global — legacy / landing nếu có |
| **@fortawesome/react** | Dependency có sẵn, dùng cục bộ |

Quy ước: icon trong nút shadcn `[&_svg]:size-4`, shrink-0.

---

## 12. Spacing & bo góc (thực hành)

Không có scale spacing riêng ngoài Tailwind default. Pattern lặp lại:

| Ngữ cảnh | Spacing / radius |
|----------|------------------|
| shadcn / form | `rounded-md`, gap-2, h-9 buttons |
| Marketing CTA | `rounded-full`, px-4–6 |
| Dossier panels | `--pc-radius: 1rem`, padding px-4–5 py-3–6 |
| Legacy cards | `rounded-2xl` (`.card-holyann`) |
| Grid trang profile | `gap-5 sm:gap-6 lg:gap-6` |

---

## 13. Scrollbar & selection

- Scrollbar: 6px, thumb primary/50 (light); dark dùng border/muted
- Landing: `selection:bg-sky-200 selection:text-slate-900`

---

## 14. File tham chiếu nhanh

| File | Nội dung |
|------|----------|
| `src/app/globals.css` | Tokens, base typography, utilities, landing/print |
| `src/app/layout.tsx` | Google Fonts (Lexend + Nunito + Playfair + Noto), metadata |
| `components.json` | shadcn config |
| `src/lib/data.ts` | `BRAND_COLORS`, marketing copy constants |
| `src/contexts/ThemeContext.tsx` | Theme state |
| `src/components/theme/ThemeScript.tsx` | FOUC / default light |
| `src/app/(student)/student/profile/profile-creative.css` | Dossier tokens & panels |
| `src/components/ui/*` | shadcn primitives |
| `src/components/student/StudentNavbar.tsx` | Student chrome |
| `src/components/layout/Header.tsx` | Landing chrome |

---

## 15. Checklist thống nhất design (đề xuất)

1. **Fonts:** ✅ Chốt Hướng 3 — Lexend (body/UI) + Nunito (headings) + Playfair/Noto display.  
2. **Radius:** Document rule: `md` cho forms, `xl–2xl` marketing, `1rem` dossier — tránh trộn trong cùng một panel.  
3. **Primary hard-code:** Ưu tiên `bg-primary` / `text-primary` hoặc `#0f4c81` nhất quán; dark dùng `sky-300`/`#38bdf8` như dossier.  
4. **Theme:** Quyết định có bật dark thật hay giữ light-first (script hiện tại).  
5. **Subsystem mới:** Nếu thêm màn học sinh lớn, cân nhắc mở rộng `.profile-creative-root` hoặc tách token `--pc-*` vào globals.

---

*Tài liệu được tổng hợp từ mã nguồn; khi đổi token hoặc font, cập nhật file này cùng `globals.css` / `layout.tsx`.*
