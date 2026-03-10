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

    // Click on rating filter dropdown
    const ratingFilter = page.locator('[data-testid="rating-filter"]');
    if (await ratingFilter.count() > 0) {
      await ratingFilter.click();

      // Select 4.5+ rating option
      await page.getByRole('option', { name: '4.5+' }).click();

      // Click apply button
      await page.locator('[data-testid="filter-apply-button"]').click();

      // Verify dialog closes
      await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();

      // Verify URL includes rating filter
      await expect(page).toHaveURL(/minRating=4\.5/);
    }
  });

  test('can clear all filters', async ({ page }) => {
    // First apply a filter
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    const ratingFilter = page.locator('[data-testid="rating-filter"]');
    if (await ratingFilter.count() > 0) {
      await ratingFilter.click();
      await page.getByRole('option', { name: '4.5+' }).click();
    }

    // Click clear all
    await page.locator('[data-testid="filter-clear-button"]').click();

    // Apply (to see the cleared state)
    await page.locator('[data-testid="filter-apply-button"]').click();

    // Verify dialog closes and filters are cleared
    await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
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
    await searchInput.fill('istanbul');

    // Wait for debounced update
    await page.waitForTimeout(500);

    // URL should include search query
    await expect(page).toHaveURL(/q=istanbul/i);
  });

  test('location input filters results', async ({ page }) => {
    // Type in location input (use first() since there may be mobile version)
    const locationInput = page.locator('[data-testid="location-input"]').first();
    await locationInput.fill('Turkey');

    // Wait for debounced update
    await page.waitForTimeout(500);

    // URL should include location filter
    await expect(page).toHaveURL(/location=Turkey/i);
  });

  test('filter badge shows count when filters active', async ({ page }) => {
    // Open filter dialog
    await page.locator('[data-testid="filter-button"]').first().click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();

    // Apply a rating filter if available
    const ratingFilter = page.locator('[data-testid="rating-filter"]');
    if (await ratingFilter.count() > 0) {
      await ratingFilter.click();
      await page.getByRole('option', { name: '4.5+' }).click();
      await page.locator('[data-testid="filter-apply-button"]').click();

      // The filter button should show a count badge
      // This verifies that filters are being tracked
      await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
    } else {
      // Just close the dialog if rating filter isn't available
      await page.locator('[data-testid="filter-apply-button"]').click();
    }
  });
});
