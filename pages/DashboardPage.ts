import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly moveFundsButton: Locator;
  readonly paymentsNav: Locator;
  readonly netLiquidity: Locator;
  readonly signOut: Locator;

  constructor(private readonly page: Page) {
    this.moveFundsButton = page.getByRole('button', { name: 'Move Funds' });
    this.paymentsNav = page.getByRole('button', { name: 'Payments', exact: true });
    this.netLiquidity = page.getByRole('heading', { level: 2 }).filter({ hasText: '$' });
    this.signOut = page.getByRole('button', { name: 'Sign Out' });
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard$/);
    await expect(this.moveFundsButton).toBeVisible();
  }

  /** Account tile, matched by its masked account number (e.g. "...7890"). */
  accountCard(accountNumber: string): Locator {
    return this.page.locator('div.group').filter({ hasText: accountNumber });
  }

  accountBalance(accountNumber: string): Locator {
    return this.accountCard(accountNumber).locator('p.text-3xl');
  }
}
