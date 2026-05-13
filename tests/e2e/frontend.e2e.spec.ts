import fs from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test.describe('frontend E2E flows', () => {
  test('renders the login page and accepts user input', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByText('Project Partners')).toBeVisible()

    const emailInput = page.getByPlaceholder('you@dpird.wa.gov.au')
    const passwordInput = page.getByPlaceholder('••••••••')

    await emailInput.fill('ella.zhang@uwa.edu.au')
    await passwordInput.fill('secret123')

    await expect(emailInput).toHaveValue('ella.zhang@uwa.edu.au')
    await expect(passwordInput).toHaveValue('secret123')
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft' })).toBeVisible()
  })

  test('supports sidebar navigation between assessment, regulation, and mitigation guide pages', async ({
    page,
  }) => {
    await page.goto('/assessment')

    await expect(page.getByText(/Fire Vulnerability\s*Assessment Tool/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Site Assessment' })).toBeVisible()

    await page.getByRole('link', { name: 'Fire Risk Regulation' }).click()
    await expect(page).toHaveURL(/\/regulation$/)
    await expect(page.getByRole('heading', { name: 'FIRE Risk REGULATION' })).toBeVisible()

    await page.getByRole('link', { name: 'View Mitigation Guide' }).click()
    await expect(page).toHaveURL(/\/mitigation-guide$/)
    await expect(page.getByRole('heading', { name: 'Mitigation Guide & Methodology' })).toBeVisible()

    await page.getByRole('link', { name: 'Site Assessment' }).click()
    await expect(page).toHaveURL(/\/assessment$/)
    await expect(page.getByRole('heading', { name: 'Site Assessment' })).toBeVisible()
  })

  test('recalculates the Site Assessment result and exports a CSV', async ({ page }) => {
    await page.goto('/assessment')

    await expect(page.getByText('High Risk')).toBeVisible()

    await page.locator('select').nth(0).selectOption('Brick / stone / masonry / concrete')
    await page.locator('select').nth(2).selectOption('Water')
    await page.locator('input[type="range"]').evaluate((element) => {
      const input = element as HTMLInputElement
      input.value = '0'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    await expect(page.getByText('Low Risk')).toBeVisible()
    await expect(page.getByText('Maintain routine 6-monthly monitoring schedule')).toBeVisible()

    await page.getByPlaceholder('Enter site name').fill('Franklin Rock Shelter')
    await page.getByPlaceholder('e.g. FRK-094').fill('FRK-094')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('assessment_FRK-094.csv')

    const downloadPath = await download.path()
    expect(downloadPath).not.toBeNull()

    const csv = await fs.readFile(downloadPath!, 'utf-8')
    expect(csv).toContain('Site Name,Franklin Rock Shelter')
    expect(csv).toContain('Site ID,FRK-094')
  })
})
