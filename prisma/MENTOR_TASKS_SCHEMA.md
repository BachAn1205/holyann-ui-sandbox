# Mentor Tasks Schema – hướng dẫn thêm vào schema.prisma

> **Quan trọng:** Chỉ dùng file **schema.prisma** cho Prisma. **Không tạo** file `MENTOR_TASKS_SCHEMA.prisma` trong thư mục `prisma/` — Prisma sẽ load mọi file `.prisma` và báo lỗi trùng model/enum (ví dụ "model students already exists"). Nếu bạn có file đó, hãy **xóa** `prisma/MENTOR_TASKS_SCHEMA.prisma` và chỉ dùng tài liệu này để copy nội dung vào `schema.prisma`.

File này chỉ là **tài liệu tham khảo**. Thêm trực tiếp vào `schema.prisma` theo các bước dưới.

## 1. Enum TaskStatus

Trong `schema.prisma` **đã có** enum `TaskStatus` (PENDING, IN_PROGRESS, SUBMITTED, COMPLETED, NEEDS_REVISION). Nếu muốn dùng thêm trạng thái cho mentor tasks (ví dụ IN_REVIEW), có thể bổ sung vào enum đó, hoặc dùng luôn các giá trị hiện có.

## 2. Model `mentor_tasks` (thêm vào schema.prisma)

```prisma
model mentor_tasks {
  id          String     @id @default(uuid()) @db.Uuid
  student_id  String     @db.Uuid
  mentor_id   String     @db.Uuid

  task_name   String     @db.VarChar(255)
  description String?    @db.Text
  deadline    DateTime?  @db.Timestamp(6)
  status      TaskStatus @default(PENDING)

  created_at  DateTime   @default(now()) @db.Timestamp(6)
  updated_at  DateTime   @updatedAt @db.Timestamp(6)

  student     students   @relation(fields: [student_id], references: [user_id], onDelete: Cascade)
  mentor      mentors    @relation(fields: [mentor_id], references: [user_id], onDelete: Cascade)

  @@index([student_id])
  @@index([mentor_id])
  @@index([status])
  @@index([deadline])
}
```

## 3. Cập nhật model `students` (trong schema.prisma)

Trong block `model students { ... }`, thêm relation:

```prisma
  mentor_tasks mentor_tasks[]
```

## 4. Cập nhật model `mentors` (trong schema.prisma)

Trong block `model mentors { ... }`, thêm relation:

```prisma
  mentor_tasks mentor_tasks[]
```

## 5. Sau khi sửa schema

```bash
npx prisma format
npx prisma migrate dev --name add_mentor_tasks
npx prisma generate
```
