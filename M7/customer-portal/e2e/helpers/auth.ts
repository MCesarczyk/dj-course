import type { Page } from '@playwright/test'

const MOCK_USER = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+48123456789',
  role: 'COMPANY_ADMIN',
  companyId: '1',
  permissions: ['CREATE_REQUEST', 'VIEW_REQUEST', 'EDIT_REQUEST', 'MANAGE_TEAM'],
  isActive: true,
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
}

const MOCK_COMPANY = {
  id: '1',
  name: 'Example Logistics Ltd.',
  registrationNumber: 'PL1234567890',
  vatNumber: 'PL1234567890',
  address: {
    street: 'ul. Logistyczna 123',
    city: 'Warsaw',
    postalCode: '00-001',
    country: 'Poland',
  },
  contactInfo: {
    primaryEmail: 'contact@example.com',
    primaryPhone: '+48123456789',
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+48987654321',
      email: 'emergency@example.com',
      relationship: 'Manager',
    },
  },
  billingAddress: {
    street: 'ul. Logistyczna 123',
    city: 'Warsaw',
    postalCode: '00-001',
    country: 'Poland',
  },
  creditLimit: 50000,
  creditUsed: 15000,
  industryType: 'Manufacturing',
  employees: [],
  paymentTerms: '30 days',
  isActive: true,
  createdAt: new Date('2024-01-01').toISOString(),
}

/**
 * Injects auth state into localStorage via an init script so the Nuxt auth
 * middleware sees an authenticated session without needing the login UI.
 * Must be called BEFORE page.goto().
 */
export async function injectAuthState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ user, company }) => {
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_company', JSON.stringify(company))
      localStorage.setItem('auth_isAuthenticated', 'true')
    },
    { user: MOCK_USER, company: MOCK_COMPANY }
  )
}

/**
 * Clears auth state from localStorage. Useful for auth-guard tests.
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_company')
    localStorage.removeItem('auth_isAuthenticated')
  })
}
