import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransferPage } from './pages/TransferPage';
import { BANKING_USER } from './support/testData';

type Fixtures = {
  loginPage: LoginPage;
  dashboard: DashboardPage;
  transferPage: TransferPage;
  /** Signs in as bankinguser123 and lands on /transfer with fresh seed data. */
  onTransferPage: TransferPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboard: async ({ page }, use) => use(new DashboardPage(page)),
  transferPage: async ({ page }, use) => use(new TransferPage(page)),

  onTransferPage: async ({ loginPage, dashboard, transferPage }, use) => {
    await loginPage.goto();
    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    await dashboard.moveFundsButton.click();
    await transferPage.expectOnForm();
    await use(transferPage);
  },
});

export { expect };
