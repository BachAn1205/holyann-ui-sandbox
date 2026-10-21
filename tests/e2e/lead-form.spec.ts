import { test, expect } from '@playwright/test';

// Helper function to generate random string to avoid duplicate emails during happy path testing
const generateRandomString = () => Math.random().toString(36).substring(7);

test.describe('Lead Generation Form E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the public landing page
    await page.goto('/');
    
    // Open the modal via the header button
    await page.locator('text=Nhận ngay định hướng cho riêng bạn').first().click();
    await expect(page.locator('h2:has-text("Kế hoạch du học của bạn thế nào?")')).toBeVisible();
  });

  test('Case 1: Happy Path - Fill full form and submit successfully', async ({ page }) => {
    // Step 1: Study Plan
    await page.click('text=Chọn bậc học');
    await page.getByRole('option', { name: 'Đại học' }).click();
    
    await page.click('text=Chọn ngân sách');
    await page.getByRole('option', { name: '1 tỷ - 2 tỷ' }).click();

    await page.fill('input[placeholder="VD: Mỹ, Úc, Canada, Anh..."]', 'Mỹ');
    await page.fill('input[placeholder="VD: Kinh doanh, Công nghệ thông tin..."]', 'Khoa học máy tính');
    await page.fill('input[placeholder="VD: Harvard, MIT, Stanford..."]', 'MIT');
    
    await page.click('button:has-text("Tiếp tục")');
    await expect(page.locator('h2:has-text("Thông tin liên hệ")')).toBeVisible();

    // Step 2: Contact Info
    const randomEmail = `test.happy.${generateRandomString()}@example.com`;
    
    await page.fill('input[placeholder="Nhập họ và tên"]', 'Nguyễn Văn A');
    await page.fill('input[placeholder="VD: 0912345678"]', '0912345678');
    await page.fill('input[placeholder="email@example.com"]', randomEmail);
    await page.fill('input[placeholder="VD: THPT Chu Văn An"]', 'THPT Chuyên KHTN');
    await page.fill('input[placeholder="VD: Lớp 11, Năm 2..."]', 'Lớp 12');
    await page.fill('input[placeholder="VD: Hà Nội, TP.HCM..."]', 'Hà Nội');

    // Submit
    await page.click('button:has-text("Hoàn thành & Nhận tư vấn")');

    // Verify Success Toast
    await expect(page.locator('text=Đăng ký thành công!').first()).toBeVisible({ timeout: 10000 });
  });

  test('Case 2: Partial Data - Submit only required fields', async ({ page }) => {
    // Skip Step 1 fields (they are optional)
    await page.click('button:has-text("Tiếp tục")');
    await expect(page.locator('h2:has-text("Thông tin liên hệ")')).toBeVisible();

    // Step 2: Contact Info (Fill only required)
    const randomEmail = `test.partial.${generateRandomString()}@example.com`;
    
    await page.fill('input[placeholder="Nhập họ và tên"]', 'Trần Thị B');
    await page.fill('input[placeholder="VD: 0912345678"]', '0988888888');
    await page.fill('input[placeholder="email@example.com"]', randomEmail);
    await page.fill('input[placeholder="VD: THPT Chu Văn An"]', 'THPT Trần Phú');
    await page.fill('input[placeholder="VD: Lớp 11, Năm 2..."]', 'Lớp 11');
    await page.fill('input[placeholder="VD: Hà Nội, TP.HCM..."]', 'Hải Phòng');

    // Submit
    await page.click('button:has-text("Hoàn thành & Nhận tư vấn")');

    // Verify Success
    await expect(page.locator('text=Đăng ký thành công!').first()).toBeVisible({ timeout: 10000 });
  });

  test('Case 3: Duplicate Email Validation - Prevents spamming', async ({ page }) => {
    // Skip Step 1 fields
    await page.click('button:has-text("Tiếp tục")');
    
    // We will use an email that we assume exists (or we can just submit the same twice in a real test environment,
    // but here we just rely on the static duplicate behavior). To guarantee a duplicate, let's submit once, then again.
    
    const duplicateEmail = `duplicate.${generateRandomString()}@example.com`;

    // First submission
    await page.fill('input[placeholder="Nhập họ và tên"]', 'Lê Văn C');
    await page.fill('input[placeholder="VD: 0912345678"]', '0912345678');
    await page.fill('input[placeholder="email@example.com"]', duplicateEmail);
    await page.fill('input[placeholder="VD: THPT Chu Văn An"]', 'THPT AMS');
    await page.fill('input[placeholder="VD: Lớp 11, Năm 2..."]', 'Lớp 10');
    await page.fill('input[placeholder="VD: Hà Nội, TP.HCM..."]', 'Hà Nội');
    await page.click('button:has-text("Hoàn thành & Nhận tư vấn")');
    await expect(page.locator('text=Đăng ký thành công!').first()).toBeVisible({ timeout: 10000 });

    // Open modal again to submit duplicate
    await page.locator('text=Nhận ngay định hướng cho riêng bạn').first().click();
    
    await page.click('button:has-text("Tiếp tục")');
    
    // Second submission with exact same email
    await page.fill('input[placeholder="Nhập họ và tên"]', 'Lê Văn C Copy');
    await page.fill('input[placeholder="VD: 0912345678"]', '0912345678');
    await page.fill('input[placeholder="email@example.com"]', duplicateEmail);
    await page.fill('input[placeholder="VD: THPT Chu Văn An"]', 'THPT AMS');
    await page.fill('input[placeholder="VD: Lớp 11, Năm 2..."]', 'Lớp 10');
    await page.fill('input[placeholder="VD: Hà Nội, TP.HCM..."]', 'Hà Nội');
    await page.click('button:has-text("Hoàn thành & Nhận tư vấn")');

    // Verify failure due to duplicate email
    await expect(page.locator('text=Email này đã được đăng ký trước đó.').first()).toBeVisible({ timeout: 10000 });
  });

});
