import { test, expect } from '@playwright/test';

test.describe('Clinic Profile Flow', () => {
  test('navigates from clinics list to clinic profile', async ({ page }) => {
    // Start on clinics page
    await page.goto('/clinics');

    // Wait for clinic cards to load
    const firstClinicCard = page.locator('[data-testid="clinic-card"]').first();
    await expect(firstClinicCard).toBeVisible();

    // Click on the clinic name (h3) to avoid hitting the Compare checkbox area
    const clinicNameLink = firstClinicCard.locator('h3');

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL(/\/clinics\/[^/]+$/),
      clinicNameLink.click(),
    ]);

    // Verify the clinic profile loads
    const profileContainer = page.locator('[data-testid="clinic-profile"]');
    await expect(profileContainer).toBeVisible({ timeout: 10000 });

    // Verify the clinic name is displayed
    const profileName = page.locator('[data-testid="clinic-name"]');
    await expect(profileName).toBeVisible({ timeout: 10000 });
  });

  test('clinic profile page renders key sections', async ({ page }) => {
    // Go directly to clinics list first to get a valid clinic ID
    await page.goto('/clinics');
    const firstClinicCard = page.locator('[data-testid="clinic-card"]').first();
    await expect(firstClinicCard).toBeVisible();

    // Click on the clinic name and wait for navigation
    const clinicNameLink = firstClinicCard.locator('h3');
    await Promise.all([
      page.waitForURL(/\/clinics\/[^/]+$/),
      clinicNameLink.click(),
    ]);

    // Wait for profile page to load with extended timeout
    await expect(page.locator('[data-testid="clinic-profile"]')).toBeVisible({ timeout: 10000 });

    // Verify hero section elements
    const clinicName = page.locator('[data-testid="clinic-name"]');
    await expect(clinicName).toBeVisible();

    // Verify reviews section exists (scroll to it)
    const reviewsSection = page.locator('#reviews');
    if (await reviewsSection.count() > 0) {
      await reviewsSection.scrollIntoViewIfNeeded();
      await expect(reviewsSection).toBeVisible();
    }
  });

  test('clinic profile shows location information', async ({ page }) => {
    // Navigate to a clinic profile
    await page.goto('/clinics');
    const firstClinicCard = page.locator('[data-testid="clinic-card"]').first();
    await expect(firstClinicCard).toBeVisible();

    // Click on the clinic name and wait for navigation
    const clinicNameLink = firstClinicCard.locator('h3');
    await Promise.all([
      page.waitForURL(/\/clinics\/[^/]+$/),
      clinicNameLink.click(),
    ]);

    // Wait for profile to load with extended timeout
    await expect(page.locator('[data-testid="clinic-profile"]')).toBeVisible({ timeout: 10000 });

    // Look for location section
    const locationSection = page.locator('#location');
    if (await locationSection.count() > 0) {
      await locationSection.scrollIntoViewIfNeeded();
      await expect(locationSection).toBeVisible();
    }
  });

  test('can navigate back to clinics list', async ({ page }) => {
    // Navigate to a clinic profile
    await page.goto('/clinics');
    const firstClinicCard = page.locator('[data-testid="clinic-card"]').first();
    await expect(firstClinicCard).toBeVisible();

    // Click on the clinic name and wait for navigation
    const clinicNameLink = firstClinicCard.locator('h3');
    await Promise.all([
      page.waitForURL(/\/clinics\/[^/]+$/),
      clinicNameLink.click(),
    ]);

    // Wait for profile to load with extended timeout
    await expect(page.locator('[data-testid="clinic-profile"]')).toBeVisible({ timeout: 10000 });

    // Navigate back using browser
    await page.goBack();

    // Verify we're back on clinics page
    await expect(page).toHaveURL(/\/clinics$/);
    await expect(page.locator('[data-testid="clinics-grid"]')).toBeVisible();
  });
});
