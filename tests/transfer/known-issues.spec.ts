/**
 * Behaviours that look like defects in the current build.
 *
 * Each test asserts the EXPECTED behaviour and is marked test.fail(), so the suite
 * stays green today. When a fix lands, Playwright reports "expected to fail but
 * passed" — at that point remove the test.fail() line and the test becomes a
 * normal regression check.
 */
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransferPage } from '../../pages/TransferPage';
import { ACCOUNTS, BANKING_USER } from '../../support/testData';
import { getSessionAccounts, getSessionBalances, patchStoredAccount } from '../../support/storage';

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

test.describe('Balance transfer — known issues', () => {
  test('a frozen account cannot be used as the transfer origin', async ({ page, loginPage, dashboard, transferPage }) => {
    test.fail(true, 'TransferScreen filters origin accounts by type only; status "Frozen" is ignored.');

    await loginPage.goto();
    await patchStoredAccount(page, BANKING_USER.username, checking.id, { status: 'Frozen' });
    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    await expect(dashboard.accountCard(checking.number)).toContainText('Frozen');

    await dashboard.moveFundsButton.click();
    await transferPage.expectOnForm();
    expect(await transferPage.optionValues(transferPage.fromSelect)).not.toContain(checking.id);
  });

  test('paying more than the card debt is rejected', async ({ onTransferPage: transfer }) => {
    test.fail(true, 'No upper bound vs. card debt; overpaying drives the card balance negative. Needs a product decision.');

    await transfer.fillForm({ fromId: savings.id, toId: creditCard.id, amount: (creditCard.balance + 50).toFixed(2) });
    await transfer.review();
    await expect(transfer.errorBanner).toBeVisible({ timeout: 2000 });
  });

  test('a completed transfer is recorded in both account ledgers', async ({ page, onTransferPage: transfer }) => {
    test.fail(true, 'handleTransfer in App.tsx updates balances but never appends a transaction.');

    const before = await getSessionAccounts(page);
    await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '100' });
    const after = await getSessionAccounts(page);

    expect(after[checking.id].transactions.length).toBe(before[checking.id].transactions.length + 1);
    expect(after[savings.id].transactions.length).toBe(before[savings.id].transactions.length + 1);
  });

  test('stored balances stay at cent precision (no floating-point drift)', async ({ page, onTransferPage: transfer }) => {
    test.fail(true, 'Balances are plain JS floats: 5345.54 - 0.02 is stored as 5345.5199999999995.');

    await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '0.02' });
    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBe(5345.52);
  });

  test('paying a card from cash does not change net liquidity', async ({ loginPage, dashboard, transferPage: transfer }) => {
    test.fail(true, 'Dashboard sums all balances, so card DEBT is counted as an asset.');

    await loginPage.goto();
    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    const before = await dashboard.netLiquidity.textContent();
    await dashboard.moveFundsButton.click();
    await transfer.transfer({ fromId: checking.id, toId: creditCard.id, amount: '100' });
    await expect(dashboard.netLiquidity).toHaveText(before ?? '', { timeout: 2000 });
  });

  test('the close (X) button has an accessible name', async ({ onTransferPage: transfer }) => {
    test.fail(true, 'Icon-only button with no aria-label.');
    await expect(transfer.closeButton).toHaveAccessibleName(/close|cancel/i, { timeout: 2000 });
  });
});
