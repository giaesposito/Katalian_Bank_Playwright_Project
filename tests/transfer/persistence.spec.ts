import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransferPage } from '../../pages/TransferPage';
import { ACCOUNTS, BANKING_USER, usd } from '../../support/testData';
import { getSessionBalances } from '../../support/storage';

type Fixtures = {
  loginPage: LoginPage;
  dashboard: DashboardPage;
  transferPage: TransferPage;
  /** Signs in as bankinguser123 and lands on /transfer with fresh seed data. */
  onTransferPage: TransferPage;
};

// Fixtures are defined in this file (not imported) so Katalon TestOps can discover the tests.
const test = base.extend<Fixtures>({
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

const { checking, savings, creditCard } = ACCOUNTS;

test.describe('Balance transfer — persistence', () => {
  test('balances survive a page reload', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '400' });
    await page.reload();

    await dashboard.expectLoaded();
    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(checking.balance - 400));
    await expect(dashboard.accountBalance(savings.number)).toHaveText(usd(savings.balance + 400));
  });

  test('balances survive signing out and back in', async ({ page, onTransferPage: transfer, dashboard, loginPage }) => {
    await transfer.transfer({ fromId: checking.id, toId: creditCard.id, amount: '50' });
    await dashboard.signOut.click();
    await expect(page).toHaveURL(/\/login$/);

    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(checking.balance - 50));
    await expect(dashboard.accountBalance(creditCard.number)).toHaveText(usd(creditCard.balance - 50));
  });

  test('consecutive transfers accumulate correctly', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '100' });
    await dashboard.moveFundsButton.click();
    await transfer.transfer({ fromId: savings.id, toId: creditCard.id, amount: '200' });
    await dashboard.moveFundsButton.click();
    await transfer.transfer({ fromId: checking.id, toId: creditCard.id, amount: '50' });

    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 100 - 50, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance + 100 - 200, 2);
    expect(balances[creditCard.id]).toBeCloseTo(creditCard.balance - 200 - 50, 2);
  });

  test('the transfer screen reflects updated balances in its dropdowns', async ({ onTransferPage: transfer, dashboard }) => {
    await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '345.54' });
    await dashboard.moveFundsButton.click();

    await expect(transfer.fromSelect.locator(`option[value="${checking.id}"]`)).toHaveText(
      'Checking (...7890) — $5,000.00',
    );
  });
});
