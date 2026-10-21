// tests/performance/soak-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// Cấu hình Soak Test (PT-005)
// Chạy ổn định trong thời gian dài (2 tiếng)
export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp-up
        { duration: '1m', target: 50 },   // Duy trì 50 users (giả lập 2 tiếng)
        { duration: '30s', target: 0 },   // Ramp-down
    ],
};

export default function () {
    const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
    const res = http.get(`${BASE_URL}/`);

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
