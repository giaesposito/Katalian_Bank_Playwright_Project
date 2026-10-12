import { test, expect } from '../../fixtures';
import { ACCOUNTS, BANKING_USER } from '../../support/testData';
import { getSessionBalances } from '../../support/storage';

const { checking, savings, creditCard } = ACCOUNTS;
const SEED = { [checking.id]: checking.balance, [savings.id]: savings.balance, [creditCard.id]: creditCard.balance };

test.describe('Balance transfer — access and navigation', () => {
  test('signed-out users are redirected from /transfer to /login', async ({ page }) => {
    await page.goto('/transfer');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('"Move Funds" on the dashboard opens the transfer screen', async ({ loginPage, dashboard, transferPage }) => {
    await loginPage.goto();
    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    await dashboard.moveFundsButton.click();
    await transferPage.expectOnForm();
  });

  test('"Payments" in the header opens the transfer screen', async ({ loginPage, dashboard, transferPage }) => {
    await loginPage.goto();
    await loginPage.login(BANKING_USER.username, BANKING_USER.password);
    await dashboard.paymentsNav.click();
    await transferPage.expectOnForm();
  });

  test('Cancel returns to the dashboard without moving money', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: '100' });
    await transfer.cancelButton.click();

    await dashboard.expectLoaded();
    expect(await getSessionBalances(page)).toEqual(SEED);
  });

  test('the close (X) button returns to the dashboard without moving money', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: '100' });
    await transfer.closeButton.click();

    await dashboard.expectLoaded();
    expect(await getSessionBalances(page)).toEqual(SEED);
  });

  test('closing from the confirmation step does not execute the transfer', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.fillForm({ fromId: checking.id, toId: savings.id, amount: '100' });
    await transfer.review();
    await transfer.expectOnConfirmation();
    await transfer.closeButton.click();

    await dashboard.expectLoaded();
    expect(await getSessionBalances(page)).toEqual(SEED);
  });

  test('Back from confirmation keeps the entered details and allows edits', async ({ page, onTransferPage: transfer }) => {
    await transfer.fillForm({ fromId: savings.id, toId: creditCard.id, amount: '75.25' });
    await transfer.review();
    await transfer.expectOnConfirmation();

    await transfer.backButton.click();
    await transfer.expectOnForm();
    await expect(transfer.fromSelect).toHaveValue(savings.id);
    await expect(transfer.toSelect).toHaveValue(creditCard.id);
    await expect(transfer.amountInput).toHaveValue('75.25');

    await transfer.amountInput.fill('80');
    await transfer.review();
    await expect(transfer.confirmAmount).toHaveText('$80.00');
    await transfer.authorize();

    const balances = await getSessionBalances(page);
    expect(balances[savings.id]).toBeCloseTo(savings.balance - 80, 2);
    expect(balances[creditCard.id]).toBeCloseTo(creditCard.balance - 80, 2);
  });
});
