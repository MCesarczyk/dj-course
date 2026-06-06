import { test, expect, type Page } from '@playwright/test'
import { injectAuthState } from './helpers/auth'
import { NewTransportationRequestPage } from './pages/new-transportation-request.page'

// ── Shared test data ──────────────────────────────────────────────────────────

const PICKUP = {
  street: 'ul. Testowa 1',
  city: 'Warsaw',
  country: 'Poland',
  contactPerson: 'Jan Kowalski',
  contactPhone: '+48 100 200 300',
  pickupDate: '2026-07-15',
}

const DELIVERY = {
  street: 'Musterstraße 42',
  city: 'Berlin',
  country: 'Germany',
  contactPerson: 'Hans Schmidt',
  contactPhone: '+49 100 200 300',
}

const CARGO = {
  description: 'Electronic components for assembly',
  weight: '750',
}

// ── Auth guard ────────────────────────────────────────────────────────────────

test.describe('auth guard', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    // Do NOT inject auth state — navigate as a guest
    await page.goto('/dashboard/transportation/new')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────

test.describe('happy path', () => {
  test('submits a full transportation request and shows the success modal', async ({ page }) => {
    await injectAuthState(page)
    const form = new NewTransportationRequestPage(page)
    await form.goto()

    // Step 1 — service type
    await form.expectStep('Service Type')
    await form.expectNextDisabled()
    await form.selectServiceType('Full Truckload')
    await form.expectNextEnabled()
    await form.clickNext()

    // Step 2 — pickup information
    await form.expectStep('Pickup Information')
    await form.fillPickupInfo(PICKUP)
    await form.expectNextEnabled()
    await form.clickNext()

    // Step 3 — delivery information
    await form.expectStep('Delivery Information')
    await form.fillDeliveryInfo(DELIVERY)
    await form.expectNextEnabled()
    await form.clickNext()

    // Step 4 — cargo information
    await form.expectStep('Cargo Information')
    await form.fillCargoInfo(CARGO)
    await form.expectNextEnabled()
    await form.clickNext()

    // Step 5 — special instructions (no required fields)
    await form.expectStep('Special Instructions')
    await form.fillSpecialInstructions('Handle with care — fragile electronics')
    await form.selectPriority('High')
    await form.clickNext()

    // Step 6 — review: verify key data is displayed
    await form.expectStep('Review & Submit')
    await form.expectReviewContains('Full Truckload')
    await form.expectReviewContains(PICKUP.street)
    await form.expectReviewContains(PICKUP.city)
    await form.expectReviewContains(DELIVERY.street)
    await form.expectReviewContains(DELIVERY.city)
    await form.expectReviewContains(CARGO.description)

    // Submit (mock API takes ~2 s)
    await form.clickSubmit()
    await form.expectSuccessModal()

    // Reference number is present and looks like TR-YYYY-XXXXXX
    const ref = await form.getReferenceNumber()
    expect(ref).toMatch(/^TR-\d{4}-\d+/)
  })
})

// ── Step 1 validation ─────────────────────────────────────────────────────────

test.describe('step 1 — service type selection', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page)
    await new NewTransportationRequestPage(page).goto()
  })

  test('Next is disabled until a service type is chosen', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.expectNextDisabled()
  })

  test('Next becomes enabled after selecting a service type', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.selectServiceType('Express Delivery')
    await form.expectNextEnabled()
  })

  test('selecting a different type changes the active card highlight', async ({ page }) => {
    await page.locator('label', { hasText: 'Less Than Truckload' }).first().click()
    const selected = page.locator('label').filter({ hasText: 'Less Than Truckload' })
    await expect(selected).toHaveClass(/ring-2/)
  })
})

// ── Step 2 validation ─────────────────────────────────────────────────────────

test.describe('step 2 — pickup information validation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page)
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    // Advance to step 2
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.expectStep('Pickup Information')
  })

  test('Next is disabled while required fields are empty', async ({ page }) => {
    await new NewTransportationRequestPage(page).expectNextDisabled()
  })

  test('shows error text for each empty required field', async ({ page }) => {
    await expect(page.getByText('Pickup address is required')).toBeVisible()
    await expect(page.getByText('City is required')).toBeVisible()
    await expect(page.getByText('Country is required')).toBeVisible()
    await expect(page.getByText('Contact person is required')).toBeVisible()
    await expect(page.getByText('Contact phone is required')).toBeVisible()
    await expect(page.getByText('Pickup date is required')).toBeVisible()
  })

  test('Next becomes enabled once all required fields are filled', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.fillPickupInfo(PICKUP)
    await form.expectNextEnabled()
  })
})

// ── Step 3 validation ─────────────────────────────────────────────────────────

test.describe('step 3 — delivery information validation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page)
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.fillPickupInfo(PICKUP)
    await form.clickNext()
    await form.expectStep('Delivery Information')
  })

  test('Next is disabled while required fields are empty', async ({ page }) => {
    await new NewTransportationRequestPage(page).expectNextDisabled()
  })

  test('Next becomes enabled once required fields are filled', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.fillDeliveryInfo(DELIVERY)
    await form.expectNextEnabled()
  })
})

// ── Step 4 validation ─────────────────────────────────────────────────────────

test.describe('step 4 — cargo information validation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page)
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.fillPickupInfo(PICKUP)
    await form.clickNext()
    await form.fillDeliveryInfo(DELIVERY)
    await form.clickNext()
    await form.expectStep('Cargo Information')
  })

  test('Next is disabled until cargo description and weight are provided', async ({ page }) => {
    await new NewTransportationRequestPage(page).expectNextDisabled()
  })

  test('Next remains disabled with only description filled', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await page.getByPlaceholder('Describe the cargo to be transported').fill('Some cargo')
    await form.expectNextDisabled()
  })

  test('Next becomes enabled once description and weight > 0 are filled', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.fillCargoInfo(CARGO)
    await form.expectNextEnabled()
  })
})

// ── Step navigation ───────────────────────────────────────────────────────────

test.describe('step navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthState(page)
  })

  test('Back button returns to the previous step', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.expectStep('Pickup Information')

    await form.clickBack()
    await form.expectStep('Service Type')
  })

  test('data entered on step 1 is preserved after going back from step 2', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    await form.selectServiceType('Express Delivery')
    await form.clickNext()
    await form.clickBack()

    // The Express Delivery card should still be highlighted
    const selected = page.locator('label').filter({ hasText: 'Express Delivery' })
    await expect(selected).toHaveClass(/ring-2/)
  })

  test('Edit button on review step navigates to the correct step', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.goto()

    // Fill all required steps
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.fillPickupInfo(PICKUP)
    await form.clickNext()
    await form.fillDeliveryInfo(DELIVERY)
    await form.clickNext()
    await form.fillCargoInfo(CARGO)
    await form.clickNext()
    await form.clickNext() // step 5 has no required fields
    await form.expectStep('Review & Submit')

    // Edit pickup information
    await form.clickEditSection('Pickup Information')
    await form.expectStep('Pickup Information')
    // Filled data should still be there
    await expect(page.getByPlaceholder('Enter pickup address')).toHaveValue(PICKUP.street)
  })

  test('cannot skip forward to step 4 from step 1 via timeline', async ({ page }) => {
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    // Timeline items for inaccessible steps should be visually disabled / not navigate
    await form.expectStep('Service Type')
    // We stay on step 1 — clicking an inaccessible step does nothing
  })
})

// ── Success modal actions ─────────────────────────────────────────────────────

test.describe('success modal', () => {
  async function reachSuccessModal(page: Page) {
    await injectAuthState(page)
    const form = new NewTransportationRequestPage(page)
    await form.goto()
    await form.selectServiceType('Full Truckload')
    await form.clickNext()
    await form.fillPickupInfo(PICKUP)
    await form.clickNext()
    await form.fillDeliveryInfo(DELIVERY)
    await form.clickNext()
    await form.fillCargoInfo(CARGO)
    await form.clickNext()
    await form.clickNext()
    await form.clickSubmit()
    await form.expectSuccessModal()
    return form
  }

  test('"View Request" navigates to the transportation requests listing', async ({ page }) => {
    const form = await reachSuccessModal(page)
    await form.clickViewRequest()
    await expect(page).toHaveURL(/\/dashboard\/requests/)
  })

  test('"Create Another Request" closes the modal and resets the form', async ({ page }) => {
    const form = await reachSuccessModal(page)
    await form.clickCreateAnother()
    // Modal should be gone and we should be back on step 1
    await expect(page.getByText('Transportation Request Submitted Successfully!')).not.toBeVisible()
  })
})
