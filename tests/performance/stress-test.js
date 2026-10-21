// tests/performance/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// Cấu hình Stress Test (PT-004)
// Mục tiêu: 500 Virtual Users
export const options = {
    stages: [
        { duration: '30s', target: 100 }, // Tăng lên 100
        { duration: '30s', target: 300 }, // Tăng lên 300
        { duration: '1m', target: 500 },  // Tăng lên 500 (Stress point)
        { duration: '1m', target: 500 },  // Duy trì ở mức 500
        { duration: '30s', target: 0 },   // Giảm về 0
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'],   // Tỷ lệ lỗi cho phép cao hơn một chút (5%) khi stress
    },
};

export default function () {
    const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
    const res = http.get(`${BASE_URL}/`);

    check(res, {
        'is status 200': (r) => r.status === 200,
    });

    sleep(1);
}
