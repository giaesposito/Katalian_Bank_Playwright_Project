# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transfer/known-issues.spec.ts >> Balance transfer — known issues >> the close (X) button has an accessible name
- Location: tests/transfer/known-issues.spec.ts:67:3

# Error details

```
Error: expect(locator).toHaveAccessibleName(expected) failed

Locator: locator('button:has(path[d="M6 18L18 6M6 6l12 12"])')
Expected pattern: /close|cancel/i
Received string:  ""
Timeout: 2000ms

Call log:
  - Expect "toHaveAccessibleName" locator('button:has(path[d="M6 18L18 6M6 6l12 12"])') with timeout 2000ms
  - waiting for locator('button:has(path[d="M6 18L18 6M6 6l12 12"])')
    21 × locator resolved to <button class="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">…</button>
       - unexpected value ""

```

```yaml
- button:
  - img
```

# Test source

```ts
  1  | /**
  2  |  * Behaviours that look like defects in the current build.
  3  |  *
  4  |  * Each test asserts the EXPECTED behaviour and is marked test.fail(), so the suite
  5  |  * stays green today. When a fix lands, Playwright reports "expected to fail but
  6  |  * passed" — at that point remove the test.fail() line and the test becomes a
  7  |  * normal regression check.
  8  |  */
  9  | import { test, expect } from '../../fixtures';
  10 | import { ACCOUNTS, BANKING_USER } from '../../support/testData';
  11 | import { getSessionAccounts, getSessionBalances, patchStoredAccount } from '../../support/storage';
  12 | 
  13 | const { checking, savings, creditCard } = ACCOUNTS;
  14 | 
  15 | test.describe('Balance transfer — known issues', () => {
  16 |   test('a frozen account cannot be used as the transfer origin', async ({ page, loginPage, dashboard, transferPage }) => {
  17 |     test.fail(true, 'TransferScreen filters origin accounts by type only; status "Frozen" is ignored.');
  18 | 
  19 |     await loginPage.goto();
  20 |     await patchStoredAccount(page, BANKING_USER.username, checking.id, { status: 'Frozen' });
  21 |     await loginPage.login(BANKING_USER.username, BANKING_USER.password);
  22 |     await expect(dashboard.accountCard(checking.number)).toContainText('Frozen');
  23 | 
  24 |     await dashboard.moveFundsButton.click();
  25 |     await transferPage.expectOnForm();
  26 |     expect(await transferPage.optionValues(transferPage.fromSelect)).not.toContain(checking.id);
  27 |   });
  28 | 
  29 |   test('paying more than the card debt is rejected', async ({ onTransferPage: transfer }) => {
  30 |     test.fail(true, 'No upper bound vs. card debt; overpaying drives the card balance negative. Needs a product decision.');
  31 | 
  32 |     await transfer.fillForm({ fromId: savings.id, toId: creditCard.id, amount: (creditCard.balance + 50).toFixed(2) });
  33 |     await transfer.review();
  34 |     await expect(transfer.errorBanner).toBeVisible({ timeout: 2000 });
  35 |   });
  36 | 
  37 |   test('a completed transfer is recorded in both account ledgers', async ({ page, onTransferPage: transfer }) => {
  38 |     test.fail(true, 'handleTransfer in App.tsx updates balances but never appends a transaction.');
  39 | 
  40 |     const before = await getSessionAccounts(page);
  41 |     await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '100' });
  42 |     const after = await getSessionAccounts(page);
  43 | 
  44 |     expect(after[checking.id].transactions.length).toBe(before[checking.id].transactions.length + 1);
  45 |     expect(after[savings.id].transactions.length).toBe(before[savings.id].transactions.length + 1);
  46 |   });
  47 | 
  48 |   test('stored balances stay at cent precision (no floating-point drift)', async ({ page, onTransferPage: transfer }) => {
  49 |     test.fail(true, 'Balances are plain JS floats: 5345.54 - 0.02 is stored as 5345.5199999999995.');
  50 | 
  51 |     await transfer.transfer({ fromId: checking.id, toId: savings.id, amount: '0.02' });
  52 |     const balances = await getSessionBalances(page);
  53 |     expect(balances[checking.id]).toBe(5345.52);
  54 |   });
  55 | 
  56 |   test('paying a card from cash does not change net liquidity', async ({ loginPage, dashboard, transferPage: transfer }) => {
  57 |     test.fail(true, 'Dashboard sums all balances, so card DEBT is counted as an asset.');
  58 | 
  59 |     await loginPage.goto();
  60 |     await loginPage.login(BANKING_USER.username, BANKING_USER.password);
  61 |     const before = await dashboard.netLiquidity.textContent();
  62 |     await dashboard.moveFundsButton.click();
  63 |     await transfer.transfer({ fromId: checking.id, toId: creditCard.id, amount: '100' });
  64 |     await expect(dashboard.netLiquidity).toHaveText(before ?? '', { timeout: 2000 });
  65 |   });
  66 | 
  67 |   test('the close (X) button has an accessible name', async ({ onTransferPage: transfer }) => {
  68 |     test.fail(true, 'Icon-only button with no aria-label.');
> 69 |     await expect(transfer.closeButton).toHaveAccessibleName(/close|cancel/i, { timeout: 2000 });
     |                                        ^ Error: expect(locator).toHaveAccessibleName(expected) failed
  70 |   });
  71 | });
  72 | 
```