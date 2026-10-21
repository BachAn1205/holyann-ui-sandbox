import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-test-user@example.com';
const TEST_PASSWORD = 'password123';
const API_URL = 'http://localhost:3000/api/testing/auth';

test.describe('Registration & OTP Flow', () => {

  test.beforeEach(async ({ request }) => {
    // Cleanup DB before each test
    await request.post(API_URL, {
      data: { action: 'cleanup', email: TEST_EMAIL }
    });
  });

  test.afterAll(async ({ request }) => {
    // Final cleanup
    await request.post(API_URL, {
      data: { action: 'cleanup', email: TEST_EMAIL }
    });
  });

  test('Case 1 & 3: Happy Path - New User Registration', async ({ page, request }) => {
    await page.goto('/register');

    // Step 1: Name
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('btn-name-next').click();

    // Step 2: Email
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();

    // Wait for OTP step to appear
    await expect(page.getByTestId('input-otp')).toBeVisible();

    // Fetch OTP from backdoor API
    const response = await request.post(API_URL, {
      data: { action: 'get-otp', email: TEST_EMAIL }
    });
    const { otp } = await response.json();
    expect(otp).toBeTruthy();

    // Step 3: Enter OTP
    await page.getByTestId('input-otp').fill(otp);
    await page.getByTestId('btn-otp-next').click();

    // Step 4: Password
    await expect(page.getByTestId('input-password')).toBeVisible();
    await page.getByTestId('input-password').fill(TEST_PASSWORD);
    await page.getByTestId('btn-password-next').click();

    // Step 5: Confirm Password
    await expect(page.getByTestId('input-confirm')).toBeVisible();
    await page.getByTestId('input-confirm').fill(TEST_PASSWORD);
    await page.getByTestId('btn-submit-register').click();

    // Verify successful redirection to login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('Case 4: User Exists & Verified', async ({ page, request }) => {
    // First register the user
    await page.goto('/register');
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('btn-name-next').click();
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();
    
    let res = await request.post(API_URL, { data: { action: 'get-otp', email: TEST_EMAIL } });
    let { otp } = await res.json();
    
    await page.getByTestId('input-otp').fill(otp);
    await page.getByTestId('btn-otp-next').click();
    await page.getByTestId('input-password').fill(TEST_PASSWORD);
    await page.getByTestId('btn-password-next').click();
    await page.getByTestId('input-confirm').fill(TEST_PASSWORD);
    await page.getByTestId('btn-submit-register').click();
    await page.waitForURL('**/login');

    // Now try to register again
    await page.goto('/register');
    await page.getByTestId('input-name').fill('Duplicate User');
    await page.getByTestId('btn-name-next').click();
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();

    // Should see error
    await expect(page.locator('text=Email này đã được đăng ký và xác thực')).toBeVisible();
  });

  test('Case 7: Incorrect OTP', async ({ page, request }) => {
    await page.goto('/register');
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('btn-name-next').click();
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();

    await expect(page.getByTestId('input-otp')).toBeVisible();

    // Enter wrong OTP
    await page.getByTestId('input-otp').fill('000000');
    await page.getByTestId('btn-otp-next').click();

    await expect(page.locator('text=Mã OTP không chính xác')).toBeVisible();
  });

  test('Case 8: Expired OTP', async ({ page, request }) => {
    await page.goto('/register');
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('btn-name-next').click();
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();

    await expect(page.getByTestId('input-otp')).toBeVisible();

    // Hack: Set OTP to expired
    const res = await request.post(API_URL, {
      data: { action: 'get-otp', email: TEST_EMAIL, setExpired: true }
    });
    const { otp } = await res.json();

    // Enter expired OTP
    await page.getByTestId('input-otp').fill(otp);
    await page.getByTestId('btn-otp-next').click();

    await expect(page.locator('text=Mã OTP đã hết hạn')).toBeVisible();
  });

  test('Case 9: Brute-force OTP (5 attempts)', async ({ page, request }) => {
    await page.goto('/register');
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('btn-name-next').click();
    await page.getByTestId('input-email').fill(TEST_EMAIL);
    await page.getByTestId('btn-email-next').click();

    await expect(page.getByTestId('input-otp')).toBeVisible();

    // Hack: Set attempts to 5
    await request.post(API_URL, {
      data: { action: 'get-otp', email: TEST_EMAIL, attempts: 5 }
    });

    // Enter any OTP
    await page.getByTestId('input-otp').fill('000000');
    await page.getByTestId('btn-otp-next').click();

    await expect(page.locator('text=Bạn đã nhập sai mã OTP quá 5 lần')).toBeVisible();
  });

});
