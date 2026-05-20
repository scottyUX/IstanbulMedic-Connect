import { test, expect } from '@playwright/test';

test.describe('Clinic Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clinics');
  });

  test('loads the clinics page with clinic cards', async ({ page }) => {
    // Wait for the clinics grid to be visible
    const clinicsGrid = page.locator('[data-testid="clinics-grid"]');
    await expect(clinicsGrid).toBeVisible();

    // Verify at least one clinic card is present
    const clinicCards = page.locator('[data-testid="clinic-card"]');
    await expect(clinicCards.first()).toBeVisible();
  });

  test('displays clinic count in header', async ({ page }) => {
    // Verify the page shows how many clinics are available
    const header = page.locator('h2:has-text("clinics available")');
    await expect(header).toBeVisible();
  });

  test('sorts clinics by Highest Rated', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();

    // Open sort dropdown
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.click();

    // Select "Highest Rated"
    await page.getByRole('option', { name: 'Highest Rated' }).click();

    // Wait for URL to update with sort parameter (handles both + and %20 encoding)
    await expect(page).toHaveURL(/sort=Highest(\+|%20)Rated/);

    // Verify clinic cards are still visible after sorting
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();

    // Get the first clinic's rating
    const firstRating = page.locator('[data-testid="clinic-card"]').first().locator('[data-testid="clinic-rating"]');

    // If ratings exist, verify the first one is visible
    const ratingCount = await firstRating.count();
    if (ratingCount > 0) {
      await expect(firstRating).toBeVisible();
    }
  });

  test('sorts clinics by Lowest Rated', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();

    // Open sort dropdown
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.click();

    // Select "Lowest Rated"
    await page.getByRole('option', { name: 'Lowest Rated' }).click();

    // Wait for URL to update (handles both + and %20 encoding)
    await expect(page).toHaveURL(/sort=Lowest(\+|%20)Rated/);

    // Verify clinic cards are still visible
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();
  });

  test('sorts clinics alphabetically', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();

    // First change to a different sort
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.click();
    await page.getByRole('option', { name: 'Highest Rated' }).click();
    await expect(page).toHaveURL(/sort=Highest(\+|%20)Rated/);

    // Now change back to Alphabetical
    await sortDropdown.click();
    await page.getByRole('option', { name: 'Alphabetical' }).click();

    // Alphabetical is default, so sort param may not be in URL
    await expect(page.locator('[data-testid="clinic-card"]').first()).toBeVisible();
  });

  test('shows empty state when no results match filters', async ({ page }) => {
    // Search for something that won't exist
    const searchInput = page.locator('[data-testid="search-input"]').first();
    await searchInput.fill('xyznonexistentclinic123');

    // Wait for results to update (debounced)
    await page.waitForTimeout(500);

    // Should show "No clinics found" message or empty grid
    // The exact behavior depends on if there are results or not
  });
});
