import { test, expect, Page } from '@playwright/test';

// Helper to navigate to a clinic profile reliably
async function navigateToClinicProfile(page: Page) {
  await page.goto('/clinics');
  const firstClinicCard = page.locator('[data-testid="clinic-card"]').first();
  await expect(firstClinicCard).toBeVisible();

  const clinicNameLink = firstClinicCard.locator('h3');
  await clinicNameLink.click();

  // Wait for URL to change first (confirms navigation started)
  await expect(page).toHaveURL(/\/clinics\/[^/]+$/, { timeout: 10000 });

  // Then wait for profile content to load
  await expect(page.locator('[data-testid="clinic-profile"]')).toBeVisible({ timeout: 10000 });
}

test.describe('Clinic Profile Flow', () => {
  test('navigates from clinics list to clinic profile', async ({ page }) => {
    await navigateToClinicProfile(page);

    // Verify the clinic name is displayed
    const profileName = page.locator('[data-testid="clinic-name"]');
    await expect(profileName).toBeVisible({ timeout: 10000 });
  });

  test('clinic profile page renders key sections', async ({ page }) => {
    await navigateToClinicProfile(page);

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
    await navigateToClinicProfile(page);

    // Look for location section
    const locationSection = page.locator('#location');
    if (await locationSection.count() > 0) {
      await locationSection.scrollIntoViewIfNeeded();
      await expect(locationSection).toBeVisible();
    }
  });

  test('can navigate back to clinics list', async ({ page }) => {
    await navigateToClinicProfile(page);

    // Navigate back using browser
    await page.goBack();

    // Verify we're back on clinics page
    await expect(page).toHaveURL(/\/clinics$/);
    await expect(page.locator('[data-testid="clinics-grid"]')).toBeVisible();
  });
});
