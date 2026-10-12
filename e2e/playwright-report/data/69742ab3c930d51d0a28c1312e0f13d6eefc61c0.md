# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transfer/known-issues.spec.ts >> Balance transfer — known issues >> a completed transfer is recorded in both account ledgers
- Location: tests/transfer/known-issues.spec.ts:37:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 16
Received: 15
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Katalian" [ref=e6] [cursor=pointer]:
        - /url: /dashboard
      - navigation [ref=e11]:
        - button "Portfolio" [ref=e12] [cursor=pointer]
        - button "Payments" [ref=e13] [cursor=pointer]
        - button "Lending" [ref=e14] [cursor=pointer]
        - button "Support" [ref=e15] [cursor=pointer]
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: "@bankinguser123"
        - generic [ref=e19]: Premier Member
      - button "Sign Out" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e25]:
        - paragraph [ref=e26]: Net Liquidity
        - generic [ref=e27]:
          - generic [ref=e28]:
            - heading "$ 111,052.21" [level=2] [ref=e29]:
              - generic [ref=e30]: $
              - text: 111,052.21
            - generic [ref=e31]:
              - generic [ref=e32]: Active Assets
              - generic [ref=e33]: Member since 2021
          - generic [ref=e34]:
            - button "Move Funds" [ref=e35] [cursor=pointer]
            - button "Deposit" [ref=e36] [cursor=pointer]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - heading "Accounts & Cards" [level=3] [ref=e39]
          - generic [ref=e41]:
            - generic [ref=e42] [cursor=pointer]:
              - generic [ref=e43]:
                - generic [ref=e44]: 💳
                - generic [ref=e45]: ...7890
              - generic [ref=e46]:
                - generic [ref=e47]:
                  - paragraph [ref=e48]: Checking
                  - paragraph [ref=e49]: $5,245.54
                - generic [ref=e50]: View Ledger →
            - generic [ref=e51] [cursor=pointer]:
              - generic [ref=e52]:
                - generic [ref=e53]: 💰
                - generic [ref=e54]: ...1234
              - generic [ref=e55]:
                - generic [ref=e56]:
                  - paragraph [ref=e57]: Savings
                  - paragraph [ref=e58]: $104,556.67
                - generic [ref=e59]: View Ledger →
            - generic [ref=e60] [cursor=pointer]:
              - generic [ref=e61]:
                - generic [ref=e62]: 💳
                - generic [ref=e63]: ...9921
              - generic [ref=e64]:
                - generic [ref=e65]:
                  - paragraph [ref=e66]: Credit Card
                  - paragraph [ref=e67]: $1,250.00
                - generic [ref=e68]: View Ledger →
          - generic [ref=e69]:
            - heading "Apply for New Products" [level=3] [ref=e70]
            - generic [ref=e72]:
              - button "💳 Checking" [ref=e73] [cursor=pointer]:
                - generic [ref=e74]: 💳
                - paragraph [ref=e75]: Checking
              - button "💰 Savings" [ref=e76] [cursor=pointer]:
                - generic [ref=e77]: 💰
                - paragraph [ref=e78]: Savings
              - button "💳 Credit" [ref=e79] [cursor=pointer]:
                - generic [ref=e80]: 💳
                - paragraph [ref=e81]: Credit
              - button "💎 Platinum" [ref=e82] [cursor=pointer]:
                - generic [ref=e83]: 💎
                - paragraph [ref=e84]: Platinum
        - generic [ref=e85]:
          - generic [ref=e86]:
            - heading "Asset Management" [level=4] [ref=e87]
            - generic [ref=e88]:
              - button "🏛️ Request Lending" [ref=e89] [cursor=pointer]:
                - generic [ref=e90]:
                  - generic [ref=e91]: 🏛️
                  - generic [ref=e92]: Request Lending
              - button "❄️ Freeze All Cards" [ref=e95] [cursor=pointer]:
                - generic [ref=e96]:
                  - generic [ref=e97]: ❄️
                  - generic [ref=e98]: Freeze All Cards
              - button "🛡️ Fraud Reporting" [ref=e101] [cursor=pointer]:
                - generic [ref=e102]:
                  - generic [ref=e103]: 🛡️
                  - generic [ref=e104]: Fraud Reporting
              - button "📞 Help Center" [ref=e107] [cursor=pointer]:
                - generic [ref=e108]:
                  - generic [ref=e109]: 📞
                  - generic [ref=e110]: Help Center
          - generic [ref=e113] [cursor=pointer]:
            - heading "Mortgage Rates dropped to 5.2%" [level=4] [ref=e117]
            - paragraph [ref=e118]: Exclusive refinancing options for existing Katalian members.
            - text: Apply Today →
  - button "Ask AI Assistant" [ref=e119] [cursor=pointer]
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
> 44 |     expect(after[checking.id].transactions.length).toBe(before[checking.id].transactions.length + 1);
     |                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
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
  69 |     await expect(transfer.closeButton).toHaveAccessibleName(/close|cancel/i, { timeout: 2000 });
  70 |   });
  71 | });
  72 | 
```