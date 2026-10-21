# Cấu trúc Module API - Hoex

Tài liệu này mô tả cấu trúc module API mới của Hoex, được thiết kế để tương thích với cấu trúc của server-ai.

## 📁 Cấu trúc Module

### Module 1: Profile Analysis (Phân tích hồ sơ)
**Endpoint:** `/api/module1/profile-analysis/`

- Phân tích hồ sơ học sinh theo 4 trụ cột (Aca, Lan, HDNK, Skill)
- Tính điểm theo vùng (USA, Asia, Europe/Australia/Canada)
- Nhận diện Spike và Sharpness
- Tạo SWOT Analysis

---

### Module 2: Career Assessment (Đánh giá nghề nghiệp)
**Endpoints:**
- `/api/module2/career-assessment/` - Đánh giá tổng hợp (MBTI + GRIT + RIASEC)
- `/api/module2/mbti/` - Chỉ đánh giá MBTI
- `/api/module2/grit-scale/` - Chỉ đánh giá GRIT
- `/api/module2/riasec/` - Chỉ đánh giá RIASEC

---

### Module 3: University Recommendation (Gợi ý trường đại học)
**Endpoint:** `/api/module3/university-recommendation/`

- Gợi ý trường đại học dựa trên output từ Module 1 và Module 2
- Phân loại: REACH, MATCH, SAFETY
- Tạo lộ trình phát triển theo tháng

---

### Module 4: Profile Enhancer (Công cụ cải thiện hồ sơ)
**Endpoints:**
- `/api/module4/profile-enhancer/` - Review CV và Essay
- `/api/module4/profile-improver/analysis/` - Phân tích profile (4 trụ)
- `/api/module4/profile-improver/enhance/` - Đề xuất hành động cải thiện

---

### Module 5: Mock Interview (Phỏng vấn thử)
**Endpoint:** `/api/module5/` (chưa triển khai)

- Phát hiện người, tư thế, tay, khuôn mặt
- Nhận diện cảm xúc qua webcam

---

## 📝 Mapping với Server-AI

| Hoex Module | Server-AI Module | Endpoint Pattern |
|------------|------------------|------------------|
| Module 1 | Feature 1 | `/api/module1/` |
| Module 2 | Feature 2 | `/api/module2/` |
| Module 3 | Feature 3 | `/api/module3/` |
| Module 4 | Feature 4 | `/api/module4/` |
| Module 5 | Feature 5 | `/api/module5/` |

## 🚀 Sử dụng

### Ví dụ: Gọi Module 1

```typescript
const response = await fetch('/api/module1/profile-analysis', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

### Ví dụ: Gọi Module 2

```typescript
// Career Assessment tổng hợp
const response = await fetch('/api/module2/career-assessment', {
  method: 'POST',
  body: JSON.stringify({ student_id: '...' })
});

// Hoặc chỉ MBTI
const response = await fetch('/api/module2/mbti', {
  method: 'POST',
  body: JSON.stringify({ answers: [...] })
});
```

### Ví dụ: Gọi Module 3

```typescript
const response = await fetch('/api/module3/university-recommendation', {
  method: 'POST',
  body: JSON.stringify({
    feature1_output: {...},
    feature2_output: {...}
  })
});
```

### Ví dụ: Gọi Module 4

```typescript
// Profile Improver - Analysis
const response = await fetch('/api/module4/profile-improver/analysis', {
  method: 'POST',
  body: JSON.stringify({
    feature1_output: {...},
    feature2_output: {...},
    feature3_output: {...}
  })
});

// Profile Enhancer
const response = await fetch('/api/module4/profile-enhancer', {
  method: 'POST',
  body: JSON.stringify({
    student_id: '...',
    type: 'CV',
    content: '...'
  })
});
```

## 📚 Tài liệu tham khảo

- Server-AI Structure: `server-ai/holyann/hoexapp/module/`
- Server-AI Documentation: `server-ai/README.md`
- Module Overview: `server-ai/holyann/hoexapp/TONG_HOP_5_MODULE.md`
