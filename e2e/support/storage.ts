import type { Page } from '@playwright/test';

/** localStorage keys used by App.tsx — the app's only persistence layer. */
export const STORAGE_KEYS = {
  USERS: 'katalian_users_v1',
  SESSION: 'katalian_session_v1',
} as const;

export interface StoredAccount {
  id: string;
  type: string;
  accountNumber: string;
  balance: number;
  status?: 'Pending' | 'Active' | 'Frozen';
  transactions: unknown[];
}

/** Accounts of the signed-in user, read straight from the session snapshot. */
export async function getSessionAccounts(page: Page): Promise<Record<string, StoredAccount>> {
  return page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!session) return {};
    return Object.fromEntries(session.accounts.map((a: any) => [a.id, a]));
  }, STORAGE_KEYS.SESSION);
}

export async function getSessionBalances(page: Page): Promise<Record<string, number>> {
  const accounts = await getSessionAccounts(page);
  return Object.fromEntries(Object.entries(accounts).map(([id, a]) => [id, a.balance]));
}

/**
 * Patches one account in the persisted users list, then reloads so App re-reads it.
 * Call while signed OUT (on /login): the session is copied from this list at login.
 */
export async function patchStoredAccount(
  page: Page,
  username: string,
  accountId: string,
  patch: Partial<StoredAccount>,
): Promise<void> {
  await page.evaluate(
    ({ key, username, accountId, patch }) => {
      const users = JSON.parse(localStorage.getItem(key) ?? '[]');
      const user = users.find((u: any) => u.username === username);
      if (!user) throw new Error(`No stored user ${username} — load the app first`);
      const acc = user.accounts.find((a: any) => a.id === accountId);
      if (!acc) throw new Error(`No account ${accountId} for ${username}`);
      Object.assign(acc, patch);
      localStorage.setItem(key, JSON.stringify(users));
    },
    { key: STORAGE_KEYS.USERS, username, accountId, patch },
  );
  await page.reload();
}
