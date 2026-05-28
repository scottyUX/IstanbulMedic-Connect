import { test, expect } from '@playwright/test';

test.describe('Clinic Filter Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clinics');
    // Wait for initial load
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();
  });

  test('opens filter dialog when clicking Filters button', async ({ page }) => {
    // Click the filter button (use first() since there's mobile + desktop version)
    const filterButton = page.locator('[data-testid="filter-button"]').first();
    await filterButton.click();

    // Verify the filter dialog opens
    const filterDialog = page.locator('[data-testid="filter-dialog"]');
    await expect(filterDialog).toBeVisible();

    // Verify dialog title is present
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
  });

  test('can apply rating filter', async ({ page }) => {
    // Open filter dialog
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    // Rating filter is now a slider — find it inside the dialog
    const ratingSlider = page.locator('[data-testid="filter-dialog"] [role="slider"]').first();
    if (await ratingSlider.count() > 0) {
      await ratingSlider.focus();
      // Press ArrowRight to move the slider off 0 (each step = 0.1, so 10 presses = 1.0)
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight');
      }

      // Click apply button
      await page.locator('[data-testid="filter-apply-button"]').click();

      // Verify dialog closes
      await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();

      // Verify URL includes a non-zero rating filter (e.g. minRating=1.0)
      await expect(page).toHaveURL(/minRating=[1-9]/);
    }
  });

  test('can clear all filters', async ({ page }) => {
    // First apply a rating filter via slider
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    const ratingSlider = page.locator('[data-testid="filter-dialog"] [role="slider"]').first();
    if (await ratingSlider.count() > 0) {
      await ratingSlider.focus();
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight');
      }
    }

    // Click clear all — resets sliders back to 0 ("Any")
    await page.locator('[data-testid="filter-clear-button"]').click();

    // Apply to confirm cleared state
    await page.locator('[data-testid="filter-apply-button"]').click();

    // Verify dialog closes and no rating filter in URL
    await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
    await expect(page).not.toHaveURL(/minRating=/);
  });

  test('filter dialog closes on apply', async ({ page }) => {
    // Open filter dialog
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    // Click apply without changing anything
    await page.locator('[data-testid="filter-apply-button"]').click();

    // Verify dialog closes
    await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
  });

  test('search input filters results', async ({ page }) => {
    // Type in search input (use first() since there may be mobile version)
    const searchInput = page.locator('[data-testid="search-input"]').first();

    // Use pressSequentially to fire real key events — required for React's onChange on webkit
    await searchInput.click();
    await searchInput.pressSequentially('istanbul');

    // Wait for the URL to update after the 400ms debounce + router.push navigation
    await page.waitForURL(/q=istanbul/i, { timeout: 10000 });
    await expect(page).toHaveURL(/q=istanbul/i);
  });

  // Location input is hidden — the platform currently only lists Istanbul clinics so filtering
  // by city/country adds no value. Re-enable this test when multi-city support is added.
  test.skip('location input filters results', async ({ page }) => {
    const locationInput = page.locator('[data-testid="location-input"]').first();
    await locationInput.click();
    await locationInput.pressSequentially('Turkey');
    await page.waitForURL(/location=Turkey/i, { timeout: 10000 });
    await expect(page).toHaveURL(/location=Turkey/i);
  });

  test('filter dialog closes on apply without changes', async ({ page }) => {
    // Open filter dialog and apply immediately without changing anything
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    await page.locator('[data-testid="filter-apply-button"]').click();

    await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
  });
});
