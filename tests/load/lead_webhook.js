import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '15s', target: 10 }, // Ramp-up
        { duration: '30s', target: 20 }, // Steady: 20 VUs gửi thông tin liên tục
        { duration: '15s', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'], // p95 dưới 1500ms
        http_req_failed: ['rate<0.01'],   // Tỷ lệ lỗi dưới 1%
    },
};

export default function () {
    const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
    
    // Tạo email và ID ngẫu nhiên để tránh lỗi trùng lặp dữ liệu (duplicate email check)
    const iteration = __ITER;
    const uniqueId = `${__VU}_${iteration}_${Math.floor(Math.random() * 100000)}`;
    
    const leadPayload = JSON.stringify({
        full_name: `Lead Test VU ${__VU}`,
        phone: '0912345678', // Số điện thoại hợp lệ theo Zod schema
        email: `lead_test_${uniqueId}@holyannexplore.com`,
        current_location: 'Hồ Chí Minh',
        current_school: 'THPT Nguyễn Thượng Hiền',
        current_grade: '12',
        study_level: 'Đại học',
        intended_major: 'Khoa học Máy tính',
        intended_country: 'Mỹ',
        intended_university: 'Stanford University',
        budget_per_year: '500 triệu - 1 tỷ VNĐ',
        category: 'Tư vấn viết luận'
    });
    
    const headers = { 'Content-Type': 'application/json' };
    
    const res = http.post(`${BASE_URL}/api/testing/lead`, leadPayload, { headers });
    
    check(res, {
        'lead submission status is 200': (r) => r.status === 200,
        'submission success is true': (r) => r.json().success === true,
    });
    
    sleep(3); // Gửi thông tin mỗi 3 giây
}
