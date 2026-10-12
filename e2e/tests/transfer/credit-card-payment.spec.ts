import { test, expect } from '../../fixtures';
import { ACCOUNTS, usd } from '../../support/testData';
import { getSessionBalances } from '../../support/storage';

const { checking, savings, creditCard } = ACCOUNTS;

test.describe('Balance transfer — credit card payments', () => {
  test('choosing a credit card as recipient switches the screen into payment mode', async ({ page, onTransferPage: transfer }) => {
    await expect(transfer.title).toHaveText(/Asset\s*Movement/);
    await expect(transfer.modeLabel('Internal Transfer')).toBeVisible();

    await transfer.toSelect.selectOption(creditCard.id);

    await expect(transfer.title).toHaveText(/Credit\s*Liquidation/);
    await expect(transfer.modeLabel('Payment Facility')).toBeVisible();
    await expect(page.getByText('Credit Facility Recipient', { exact: true })).toBeVisible();
    await expect(transfer.currentIndebtedness).toHaveText(usd(creditCard.balance));
    await expect(transfer.minPaymentButton).toBeVisible();
    await expect(transfer.payFullBalanceButton).toBeVisible();
  });

  test('switching back to a deposit recipient leaves payment mode', async ({ onTransferPage: transfer }) => {
    await transfer.toSelect.selectOption(creditCard.id);
    await expect(transfer.modeLabel('Payment Facility')).toBeVisible();

    await transfer.toSelect.selectOption(savings.id);
    await expect(transfer.modeLabel('Internal Transfer')).toBeVisible();
    await expect(transfer.minPaymentButton).toBeHidden();
    await expect(transfer.payFullBalanceButton).toBeHidden();
  });

  test('"Min Payment" fills $25 and paying it reduces card debt and checking', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.fromSelect.selectOption(checking.id);
    await transfer.toSelect.selectOption(creditCard.id);
    await transfer.minPaymentButton.click();
    await expect(transfer.amountInput).toHaveValue('25.00');

    await transfer.review();
    await transfer.expectOnConfirmation();
    await expect(transfer.authorizeButton).toHaveText('Authorize Payment');
    await expect(transfer.confirmAmount).toHaveText('$25.00');
    await transfer.authorize();

    // Card balance is debt, so a payment SUBTRACTS from it.
    await expect(dashboard.accountBalance(creditCard.number)).toHaveText(usd(creditCard.balance - 25));
    await expect(dashboard.accountBalance(checking.number)).toHaveText(usd(checking.balance - 25));

    const balances = await getSessionBalances(page);
    expect(balances[creditCard.id]).toBeCloseTo(creditCard.balance - 25, 2);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 25, 2);
  });

  test('"Pay Full Balance" fills the full debt and clears the card to $0.00', async ({ page, onTransferPage: transfer, dashboard }) => {
    await transfer.fromSelect.selectOption(savings.id);
    await transfer.toSelect.selectOption(creditCard.id);
    await transfer.payFullBalanceButton.click();
    await expect(transfer.amountInput).toHaveValue(String(creditCard.balance));

    await transfer.review();
    await transfer.authorize();

    await expect(dashboard.accountBalance(creditCard.number)).toHaveText(usd(0));
    const balances = await getSessionBalances(page);
    expect(balances[creditCard.id]).toBeCloseTo(0, 2);
    expect(balances[savings.id]).toBeCloseTo(savings.balance - creditCard.balance, 2);
  });

  test('a custom payment amount is applied to the card', async ({ page, onTransferPage: transfer }) => {
    await transfer.transfer({ fromId: checking.id, toId: creditCard.id, amount: '310.75' });

    const balances = await getSessionBalances(page);
    expect(balances[creditCard.id]).toBeCloseTo(creditCard.balance - 310.75, 2);
    expect(balances[checking.id]).toBeCloseTo(checking.balance - 310.75, 2);
  });

  test('a card payment still respects the origin account balance', async ({ page, onTransferPage: transfer }) => {
    await transfer.fillForm({ fromId: checking.id, toId: creditCard.id, amount: (checking.balance + 1).toFixed(2) });
    await transfer.review();

    await expect(transfer.errorBanner).toHaveText('Insufficient liquidity in origin facility.');
    await expect(transfer.authorizeButton).toBeHidden();
    const balances = await getSessionBalances(page);
    expect(balances[creditCard.id]).toBe(creditCard.balance);
  });
});
