# Migration DB – Improve (Feature 4 + Essay comments)

Các bước migrate database sau khi chỉnh sửa Prisma (thêm bảng `essays`, `essay_comments`, `student_cv_documents`).

## 1. Chỉnh sửa Prisma

Đã thêm trong `prisma/schema.prisma`:

- **essays**: bài luận của học sinh (student_id, title, content).
- **essay_comments**: nhận xét của mentor lên bài luận (essay_id, author_id, content, start_offset, end_offset).
- **student_cv_documents**: (tùy chọn) lưu metadata CV đã tải (student_id, file_url, file_name, uploaded_at).

Quan hệ: `students` → `essays`, `essays` → `essay_comments` (author = users), `students` → `student_cv_documents`.

## 2. Generate Prisma Client

```bash
cd hoex
npx prisma generate
```

Nếu bị lỗi **EPERM** (file bị khóa), tắt dev server (`npm run dev`) rồi chạy lại.

## 3. Đẩy schema lên database

```bash
npx prisma db push
```

Lệnh này tạo/cập nhật bảng trong DB (PostgreSQL) theo schema hiện tại, không tạo file migration.

---

**Lưu ý:** Nếu dự án dùng migration thay vì `db push`, sau khi sửa schema chạy:

```bash
npx prisma migrate dev --name add_improve_essay_cv_tables
```

Thay vì bước 3 ở trên.
