import { expect, type Page } from '@playwright/test'

export interface PickupData {
  street: string
  city: string
  country: string
  contactPerson: string
  contactPhone: string
  pickupDate: string
}

export interface DeliveryData {
  street: string
  city: string
  country: string
  contactPerson: string
  contactPhone: string
}

export interface CargoData {
  description: string
  weight: string
}

export class NewTransportationRequestPage {
  constructor(private readonly page: Page) {}

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/dashboard/transportation/new')
    await expect(
      this.page.getByRole('heading', { name: 'New Transportation Request' })
    ).toBeVisible()
    // Wait for Vue hydration to complete by checking that the app root has been
    // mounted (__vue_app__ is set by Vue.mount() after all lifecycle hooks run).
    await this.page.waitForFunction(() => {
      const root = document.querySelector('#__nuxt') ?? document.querySelector('#app')
      return root != null && !!(root as any).__vue_app__
    })
    // onMounted fires synchronously during mount(), but it schedules a Pinia
    // mutation (resetForm) whose DOM flush is a microtask. Give the event loop a
    // single tick so the microtask runs and Next is definitely disabled before
    // any test interaction begins.
    await this.page.waitForTimeout(150)
    await expect(this.page.getByRole('button', { name: 'Next' })).toBeDisabled()
  }

  async clickNext() {
    await this.page.getByRole('button', { name: 'Next' }).click()
  }

  async clickBack() {
    await this.page.getByRole('button', { name: 'Back' }).click()
  }

  async clickSubmit() {
    await this.page.getByRole('button', { name: 'Submit Request' }).click()
  }

  // ── Step assertions ──────────────────────────────────────────────────────────

  async expectStep(stepTitle: string) {
    await expect(this.page.getByRole('heading', { name: stepTitle, level: 2 })).toBeVisible()
  }

  async expectNextEnabled() {
    await expect(this.page.getByRole('button', { name: 'Next' })).toBeEnabled()
  }

  async expectNextDisabled() {
    await expect(this.page.getByRole('button', { name: 'Next' })).toBeDisabled()
  }

  // ── Step 1: Service Type ─────────────────────────────────────────────────────

  async selectServiceType(name: string) {
    await this.page.locator('label', { hasText: name }).first().click()
  }

  // ── Step 2: Pickup Information ───────────────────────────────────────────────

  async fillPickupInfo(data: PickupData) {
    await this.page.getByPlaceholder('Enter pickup address').fill(data.street)
    await this.page.getByPlaceholder('Enter city').first().fill(data.city)
    // The country <select> has the `required` attribute; the loading-type select does not.
    await this.requiredSelect().selectOption(data.country)
    await this.page.getByPlaceholder('Contact person name').first().fill(data.contactPerson)
    await this.page.getByPlaceholder('Phone number').first().fill(data.contactPhone)
    await this.page.locator('input[type="date"]').first().fill(data.pickupDate)
  }

  // ── Step 3: Delivery Information ─────────────────────────────────────────────

  async fillDeliveryInfo(data: DeliveryData) {
    await this.page.getByPlaceholder('Enter delivery address').fill(data.street)
    await this.page.getByPlaceholder('Enter city').first().fill(data.city)
    await this.requiredSelect().selectOption(data.country)
    await this.page.getByPlaceholder('Contact person name').first().fill(data.contactPerson)
    await this.page.getByPlaceholder('Phone number').first().fill(data.contactPhone)
  }

  // ── Step 4: Cargo Information ────────────────────────────────────────────────

  async fillCargoInfo(data: CargoData) {
    await this.page.getByPlaceholder('Describe the cargo to be transported').fill(data.description)
    await this.page.getByPlaceholder('Enter weight in kg').fill(data.weight)
  }

  // ── Step 5: Special Instructions ────────────────────────────────────────────

  async fillSpecialInstructions(instructions?: string) {
    if (instructions) {
      await this.page
        .getByPlaceholder(
          'Any special handling requirements, delivery instructions, or additional information...'
        )
        .fill(instructions)
    }
  }

  async selectPriority(priority: 'Low' | 'Normal' | 'High' | 'Urgent') {
    await this.page
      .locator('label', { hasText: priority })
      .filter({ has: this.page.locator('input[type="radio"]') })
      .first()
      .click()
  }

  // ── Step 6: Review ───────────────────────────────────────────────────────────

  async clickEditSection(sectionTitle: string) {
    const section = this.page.locator('h3', { hasText: sectionTitle }).locator('..')
    await section.getByRole('button', { name: 'Edit' }).click()
  }

  async expectReviewContains(text: string) {
    await expect(this.page.locator('.card')).toContainText(text)
  }

  // ── Success modal ────────────────────────────────────────────────────────────

  async expectSuccessModal() {
    await expect(
      this.page.getByText('Transportation Request Submitted Successfully!')
    ).toBeVisible({ timeout: 10_000 })
  }

  async getReferenceNumber(): Promise<string> {
    const el = this.page.locator('p.font-mono')
    await expect(el).toBeVisible()
    return (await el.textContent()) ?? ''
  }

  async clickViewRequest() {
    await this.page.getByRole('button', { name: 'View Request' }).click()
  }

  async clickCreateAnother() {
    await this.page.getByRole('button', { name: 'Create Another Request' }).click()
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  /**
   * Returns the first <select required> on the current step.
   * The country selects have `required`; loading/unloading-type selects do not,
   * so this selector is unambiguous on both step 2 and step 3.
   */
  private requiredSelect() {
    return this.page.locator('select[required]').first()
  }
}
