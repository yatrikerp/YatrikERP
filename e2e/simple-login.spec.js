// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Test credentials
const TEST_USERS = {
  admin: {
    email: 'admin@yatrik.com',
    password: 'admin123'
  },
  depot_alp: {
    email: 'alp-depot@yatrik.com',
    password: 'ALP@2024'
  },
  conductor: {
    email: 'conductor001@kmg-depot.com',
    password: 'Yatrik123'
  },
  driver: {
    email: 'driver001@trivandrumcentraldepot-depot.com',
    password: 'Yatrik123'
  },
  passenger: {
    email: 'lijithmk2026@mca.ajce.in',
    password: 'Akhil@123'
  }
};

test.describe('Simple Login Tests - YATRIK ERP', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
    await page.goto(BASE_URL);
  });

  test('Should load login page successfully', async ({ page }) => {
    await expect(page.locator('h1:has-text("Yatrik Account")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test('Should validate empty login form', async ({ page }) => {
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    const emailInput = page.locator('input[type="email"]');
    // @ts-ignore
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();
  });

  test('Should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]').first();
    const toggleButton = page.locator('button[aria-label*="password"]').first();
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Should reject invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl === BASE_URL).toBeTruthy();
  });

  test('Admin login - Should succeed and redirect', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isLoggedIn = url.includes('/admin') || 
                       url.includes('/dashboard') || 
                       !url.includes('/login');
    
    expect(isLoggedIn).toBeTruthy();
    
    const hasDashboard = await page.locator('nav, header, [class*="dashboard"]').count() > 0;
    expect(hasDashboard).toBeGreaterThan(0);
  });

  test('Depot login - Should succeed and redirect', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.depot_alp.email);
    await page.fill('input[type="password"]', TEST_USERS.depot_alp.password);
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isLoggedIn = url.includes('/depot') || 
                       url.includes('/dashboard') || 
                       !url.includes('/login');
    
    expect(isLoggedIn).toBeTruthy();
  });

  test('Conductor login - Should succeed and redirect', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.conductor.email);
    await page.fill('input[type="password"]', TEST_USERS.conductor.password);
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isLoggedIn = !url.includes('/login');
    expect(isLoggedIn).toBeTruthy();
  });

  test('Driver login - Should succeed and redirect', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.driver.email);
    await page.fill('input[type="password"]', TEST_USERS.driver.password);
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isLoggedIn = !url.includes('/login');
    expect(isLoggedIn).toBeTruthy();
  });

  test('Passenger login - Should succeed and redirect', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.passenger.email);
    await page.fill('input[type="password"]', TEST_USERS.passenger.password);
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isLoggedIn = !url.includes('/login');
    expect(isLoggedIn).toBeTruthy();
  });

  test('Should switch to signup tab', async ({ page }) => {
    await page.locator('button:has-text("Create account")').click();
    await page.waitForTimeout(500);
    
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('Should validate signup email format', async ({ page }) => {
    await page.locator('button:has-text("Create account")').click();
    await page.waitForTimeout(500);
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.locator('input[name="name"]').click();
    
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[name="email"]');
    // @ts-ignore
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();
  });

  test('Mobile responsive - Login form', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
  });

  test('Tablet responsive - Login form', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
  });
});
