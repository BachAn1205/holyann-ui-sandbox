# Profile Analysis AI Integration - Hướng dẫn tích hợp Feature 1

## Tổng quan

Tính năng phân tích hồ sơ AI (Feature 1) cho phép:
- Phân tích hồ sơ học sinh bằng AI
- Lưu kết quả vào database
- Hiển thị kết quả trên giao diện Profile
- Xem lịch sử phân tích

## Cấu trúc files đã tạo

### 1. Database Schema
- **File**: `prisma/schema.prisma` - Đã cập nhật model `profile_analyses`
- **SQL Migration**: `database/update-profile-analyses.sql` - Script SQL để chạy migration thủ công

### 2. Types
- **File**: `src/types/profile-analysis.ts`
- Định nghĩa các interface cho input/output của AI API

### 3. Services
- **File**: `src/services/profile-analysis.service.ts`
- Functions:
  - `buildAnalysisPayloadFromStudent(studentId)` - Tạo payload từ data trong DB
  - `analyzeAndSaveProfile(studentId, customPayload?)` - Phân tích và lưu kết quả
  - `getLatestAnalysis(studentId)` - Lấy kết quả mới nhất
  - `getAnalysisHistory(studentId, limit)` - Lấy lịch sử
  - `getAnalysisById(analysisId)` - Lấy kết quả theo ID

### 4. API Endpoints

#### Phân tích hồ sơ (đã có)
```
POST /api/students/[student_id]/analyze-profile
```
- Phân tích hồ sơ và tự động lưu vào database

#### Lấy lịch sử phân tích (mới)
```
GET /api/students/[student_id]/analysis-history
```
Query params:
- `limit`: Số lượng kết quả (default: 10)
- `id`: Lấy theo analysis ID cụ thể

#### API Module 1 (alternative)
```
POST /api/module1/profile-analysis/analyze
GET /api/module1/profile-analysis/results
```

### 5. React Hook
- **File**: `src/hooks/useProfileAnalysis.ts`
- Hook để quản lý state và gọi API trong components

### 6. UI Components
- **File**: `src/components/student/profile/ProfileAnalysisResultCard.tsx`
- Component hiển thị tóm tắt kết quả phân tích trên Profile page

## Hướng dẫn cài đặt

### Bước 1: Chạy Database Migration

**Cách 1: Sử dụng SQL trực tiếp (Supabase)**
1. Mở Supabase Dashboard > SQL Editor
2. Copy nội dung file `database/update-profile-analyses.sql`
3. Chạy SQL

**Cách 2: Sử dụng Prisma Migration**
```powershell
cd D:\holyann-ai-web
npx prisma migrate dev --name add_profile_analysis_fields
npx prisma generate
```

### Bước 2: Regenerate Prisma Client
```powershell
npx prisma generate
```

### Bước 3: Restart Dev Server
```powershell
npm run dev
```

## Sử dụng trong code

### Gọi API phân tích từ Frontend
```typescript
// Phân tích hồ sơ
const response = await fetch(`/api/students/${studentId}/analyze-profile`, {
  method: 'POST',
});
const { success, data } = await response.json();

// Lấy kết quả đã lưu
const historyResponse = await fetch(`/api/students/${studentId}/analysis-history`);
const { latest, history } = await historyResponse.json();
```

### Sử dụng Hook trong Component
```typescript
import { useProfileAnalysis } from '@/hooks/useProfileAnalysis';

function ProfileComponent({ studentId }) {
  const {
    analyzing,
    result,
    analyzeProfile,
    fetchResults,
    pillarScores,
    mainSpike,
  } = useProfileAnalysis({ studentId, autoLoad: true });

  return (
    <div>
      <button onClick={() => analyzeProfile()} disabled={analyzing}>
        {analyzing ? 'Đang phân tích...' : 'Phân tích hồ sơ'}
      </button>
      
      {result && (
        <div>
          <p>Spike: {mainSpike}</p>
          <p>Điểm học thuật: {pillarScores?.aca}</p>
        </div>
      )}
    </div>
  );
}
```

## Cấu trúc dữ liệu lưu trong Database

### Bảng `profile_analyses`

| Column | Type | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| student_id | UUID | FK to students |
| analysis_date | Timestamp | Thời gian phân tích |
| input_data | JSONB | Dữ liệu input gửi đến AI |
| full_result | JSONB | Kết quả đầy đủ từ AI |
| score_aca | Float | Điểm Học thuật (0-100) |
| score_lan | Float | Điểm Ngôn ngữ (0-100) |
| score_hdnk | Float | Điểm Hoạt động ngoại khóa |
| score_skill | Float | Điểm Kỹ năng |
| score_usa | Float | Điểm khu vực Mỹ |
| score_asia | Float | Điểm khu vực Châu Á |
| score_europe | Float | Điểm khu vực Âu/Úc |
| main_spike | String | Loại Spike chính |
| spike_sharpness | String | Độ sắc (Exceptional/High/Med/Low) |
| spike_score | Float | Điểm Spike |
| swot_data | JSONB | Phân tích SWOT |
| all_spike_scores | JSONB | Điểm tất cả 12 loại Spike |

## AI Server Configuration

Đảm bảo biến môi trường được set:
```env
AI_SERVER_URL=http://your-django-server:8000
```

## Troubleshooting

### Lỗi "Cannot connect to AI server"
- Kiểm tra Django server đang chạy
- Kiểm tra `AI_SERVER_URL` trong `.env`

### Lỗi "Prisma field not found"
- Chạy `npx prisma generate` sau khi update schema
- Chạy SQL migration nếu chưa có columns mới

### Kết quả không lưu vào DB
- Kiểm tra logs server để xem lỗi chi tiết
- Đảm bảo student_id là UUID hợp lệ
