# Holyann UI sandbox

Ban sao giao dien de refactor UI/UX. **Khong ket noi database that** va **khong chua du lieu nguoi dung that**.

Du lieu hien tren man hinh nam trong `src/lib/sample-data.ts` (hoc sinh, co van, truong hoc deu la ten gia). `src/lib/prisma.ts` chi doc bo nho do.

## Dang nhap mau

Mat khau chung: `demo1234`

| Email | Vai tro |
| --- | --- |
| student@demo.local | Hoc sinh |
| mentor@demo.local | Co van |
| admin@demo.local | Quan tri |

## Chay local

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Khong dien `DATABASE_URL` that vao file nay.
