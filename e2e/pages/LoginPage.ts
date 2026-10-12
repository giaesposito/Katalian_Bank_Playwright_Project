import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Secure ID');
    this.password = page.getByLabel('Access Code');
    this.submit = page.getByRole('button', { name: 'Enter Vault Access' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.submit).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
    await expect(this.page).toHaveURL(/\/dashboard$/);
  }
}
