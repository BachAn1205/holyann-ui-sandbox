// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// Cấu hình Load Test (PT-002 & PT-003)
// 100 Virtual Users (VUs) đồng thời
export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp-up: Tăng dần lên 50 users trong 1 phút
        { duration: '3m', target: 100 }, // Duy trì 100 users trong 3 phút
        { duration: '1m', target: 0 },   // Ramp-down: Giảm về 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // P95 phải dưới 500ms
        http_req_failed: ['rate<0.01'],   // Tỷ lệ lỗi dưới 1%
    },
};

export default function () {
    // Sử dụng biến môi trường BASE_URL hoặc mặc định là localhost
    const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
    
    // Test endpoint công khai (Trang chủ)
    const res = http.get(`${BASE_URL}/`);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
