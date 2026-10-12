import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransferPage } from '../../pages/TransferPage';
import { ACCOUNTS, BANKING_USER, MESSAGES } from '../../support/testData';
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
const SEED = { [checking.id]: checking.balance, [savings.id]: savings.balance, [creditCard.id]: creditCard.balance };

test.describe('Balance transfer — account selection rules', () => {
  test('defaults to Checking → Savings', async ({ onTransferPage: transfer }) => {
    await expect(transfer.fromSelect).toHaveValue(checking.id);
    await expect(transfer.toSelect).toHaveValue(savings.id);
  });

  test('origin list only offers deposit accounts (no credit cards)', async ({ onTransferPage: transfer }) => {
    expect(await transfer.optionValues(transfer.fromSelect)).toEqual([checking.id, savings.id]);
  });

  test('recipient list offers every account, including credit cards', async ({ onTransferPage: transfer }) => {
    expect(await transfer.optionValues(transfer.toSelect)).toEqual([checking.id, savings.id, creditCard.id]);
  });

  test('options show account type, masked number and balance', async ({ onTransferPage: transfer }) => {
    await expect(transfer.fromSelect.locator(`option[value="${checking.id}"]`)).toHaveText(
      'Checking (...7890) — $5,345.54',
    );
    await expect(transfer.toSelect.locator(`option[value="${creditCard.id}"]`)).toHaveText(
      'Credit Card (...9921) — $1,250.00',
    );
  });

  test('picking the current recipient as origin auto-reassigns the recipient', async ({ onTransferPage: transfer }) => {
    await expect(transfer.toSelect).toHaveValue(savings.id);
    await transfer.fromSelect.selectOption(savings.id);

    await expect(transfer.fromSelect).toHaveValue(savings.id);
    await expect(transfer.toSelect).not.toHaveValue(savings.id);
    await expect(transfer.toSelect).toHaveValue(checking.id);
  });

  test('transferring to the same account is rejected', async ({ page, onTransferPage: transfer }) => {
    await transfer.fillForm({ fromId: checking.id, toId: checking.id, amount: '10' });
    await transfer.review();

    await expect(transfer.errorBanner).toHaveText(MESSAGES.selfTransfer);
    await expect(transfer.authorizeButton).toBeHidden();
    expect(await getSessionBalances(page)).toEqual(SEED);
  });
});

test.describe('Balance transfer — amount validation', () => {
  test('amount above the origin balance is rejected', async ({ page, onTransferPage: transfer }) => {
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: (checking.balance + 0.01).toFixed(2) });
    await transfer.review();

    await expect(transfer.errorBanner).toHaveText(MESSAGES.insufficientFunds);
    await expect(transfer.authorizeButton).toBeHidden();
    expect(await getSessionBalances(page)).toEqual(SEED);
  });

  test('insufficient-funds check uses the selected origin, not the largest account', async ({ onTransferPage: transfer }) => {
    // 10,000 is fine from Savings but not from Checking.
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: '10000' });
    await transfer.review();
    await expect(transfer.errorBanner).toHaveText(MESSAGES.insufficientFunds);

    await transfer.fromSelect.selectOption(savings.id);
    await transfer.toSelect.selectOption(checking.id);
    await transfer.review();
    await transfer.expectOnConfirmation();
  });

  test('error clears once the input is corrected', async ({ onTransferPage: transfer }) => {
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: '999999' });
    await transfer.review();
    await expect(transfer.errorBanner).toBeVisible();

    await transfer.amountInput.fill('50');
    await transfer.review();
    await transfer.expectOnConfirmation();
    await expect(transfer.errorBanner).toBeHidden();
  });

  // The amount input is type=number, required, min=0.01, step=0.01, so the browser's
  // constraint validation blocks these before the app's own checks run.
  const blocked: { name: string; value: string; flag: 'valueMissing' | 'rangeUnderflow' | 'stepMismatch' }[] = [
    { name: 'empty', value: '', flag: 'valueMissing' },
    { name: 'zero', value: '0', flag: 'rangeUnderflow' },
    { name: 'negative', value: '-50', flag: 'rangeUnderflow' },
    { name: 'sub-cent precision', value: '10.005', flag: 'stepMismatch' },
  ];

  for (const { name, value, flag } of blocked) {
    test(`${name} amount is blocked by form validation`, async ({ page, onTransferPage: transfer }) => {
      await transfer.fromSelect.selectOption(checking.id);
      await transfer.toSelect.selectOption(savings.id);
      await transfer.amountInput.fill(value);
      await transfer.review();

      const validity = await transfer.amountValidity();
      expect(validity.valid).toBe(false);
      expect(validity[flag]).toBe(true);

      await transfer.expectOnForm();
      await expect(transfer.authorizeButton).toBeHidden();
      expect(await getSessionBalances(page)).toEqual(SEED);
    });
  }

  test('non-numeric text cannot be entered into the amount field', async ({ onTransferPage: transfer }) => {
    await transfer.amountInput.pressSequentially('abc');
    await expect(transfer.amountInput).toHaveValue('');
  });
});
