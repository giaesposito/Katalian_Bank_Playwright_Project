/**
 * Mirrors the seed data in /constants.ts. Each Playwright test runs in a fresh
 * browser context (empty localStorage), so every test starts from these values.
 */
export const BANKING_USER = {
  username: 'bankinguser123',
  password: 'notapassword@123',
} as const;

export const ACCOUNTS = {
  checking: { id: 'acc1-1', type: 'Checking', number: '...7890', balance: 5345.54 },
  savings: { id: 'acc1-2', type: 'Savings', number: '...1234', balance: 104456.67 },
  creditCard: { id: 'acc1-3', type: 'Credit Card', number: '...9921', balance: 1250.0 },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

export const MESSAGES = {
  insufficientFunds: 'Insufficient liquidity in origin facility.',
  selfTransfer: 'Self-transfer to identical facility is prohibited.',
  invalidAmount: 'Valid capital amount required.',
} as const;

/** Same formatting the app uses for balances (en-US, min 2 fraction digits). */
export const usd = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
