import { test, expect } from '../../fixtures';
import { ACCOUNTS, usd } from '../../support/testData';
import { getSessionBalances } from '../../support/storage';

const { checking, savings, creditCard } = ACCOUNTS;

test.describe('Balance transfer — execution between deposit accounts', () => {
  test('Checking → Savings moves the amount and updates both balances', async ({ page, onTransferPage, dashboard }) => {
    await onTransferPage.transfer({ fromId: checking.id, toId: savings.id, amount: '250.00' });

    await dashboard.expectLoaded();
    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(checking.balance - 250));
    await expect(dashboard.accountBalance(savings.number)).toHaveText(usd(savings.balance + 250));
    await expect(dashboard.accountBalance(creditCard.number)).toHaveText(usd(creditCard.balance));

    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 250, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance + 250, 2);
    expect(balances[creditCard.id]).toBeCloseTo(creditCard.balance, 2);
  });

  test('Savings → Checking moves the amount in the other direction', async ({ page, onTransferPage, dashboard }) => {
    await onTransferPage.transfer({ fromId: savings.id, toId: checking.id, amount: '1000' });

    await expect(dashboard.accountBalance(savings.number)).toHaveText(usd(savings.balance - 1000));
    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(checking.balance + 1000));

    const balances = await getSessionBalances(page);
    expect(balances[savings.id]).toBeCloseTo(savings.balance - 1000, 2);
    expect(balances[checking.id]).toBeCloseTo(checking.balance + 1000, 2);
  });

  test('transferring the exact available balance is allowed and empties the origin', async ({ page, onTransferPage, dashboard }) => {
    await onTransferPage.transfer({ fromId: checking.id, toId: savings.id, amount: checking.balance });

    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(0));
    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBeCloseTo(0, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance + checking.balance, 2);
  });

  test('the minimum amount of $0.01 is accepted', async ({ page, onTransferPage }) => {
    await onTransferPage.transfer({ fromId: checking.id, toId: savings.id, amount: '0.01' });

    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 0.01, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance + 0.01, 2);
  });

  test('confirmation step shows amount, origin and recipient before anything moves', async ({ page, onTransferPage }) => {
    await onTransferPage.fillForm({ fromId: checking.id, toId: savings.id, amount: '1234.5' });
    await onTransferPage.review();

    await onTransferPage.expectOnConfirmation();
    await expect(onTransferPage.authorizeButton).toHaveText('Authorize Transfer');
    await expect(onTransferPage.confirmAmount).toHaveText('$1,234.50');
    await expect(onTransferPage.confirmOrigin).toContainText(checking.type);
    await expect(onTransferPage.confirmOrigin).toContainText(checking.number);
    await expect(onTransferPage.confirmRecipient).toContainText(savings.type);
    await expect(onTransferPage.confirmRecipient).toContainText(savings.number);

    // Nothing has been debited yet.
    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBe(checking.balance);
    expect(balances[savings.id]).toBe(savings.balance);
  });

  test('net liquidity is unchanged by a transfer between two deposit accounts', async ({ onTransferPage, dashboard }) => {
    const total = checking.balance + savings.balance + creditCard.balance; // as the app currently sums it
    const formatted = total.toLocaleString('en-US', { minimumFractionDigits: 2 });

    await onTransferPage.transfer({ fromId: savings.id, toId: checking.id, amount: '500' });
    await expect(dashboard.netLiquidity).toContainText(formatted);
  });

  test('double-clicking Authorize only debits once', async ({ page, onTransferPage, dashboard }) => {
    await onTransferPage.fillForm({ fromId: checking.id, toId: savings.id, amount: '100' });
    await onTransferPage.review();
    await onTransferPage.expectOnConfirmation();

    await onTransferPage.authorizeButton.dblclick();
    await dashboard.expectLoaded();
    // Let any second in-flight mock API call (~800 ms) settle before asserting.
    await page.waitForTimeout(1500);

    const balances = await getSessionBalances(page);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 100, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance + 100, 2);
  });
});
