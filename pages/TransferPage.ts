import { expect, type Locator, type Page } from '@playwright/test';

export interface TransferInput {
  fromId: string;
  toId: string;
  amount: string | number;
}

/** Page object for /transfer — both the entry form and the "Final Authorization" step. */
export class TransferPage {
  // Entry form
  readonly title: Locator;
  readonly fromSelect: Locator;
  readonly toSelect: Locator;
  readonly amountInput: Locator;
  readonly reviewButton: Locator;
  readonly cancelButton: Locator;
  /** Top-right "X" — has no accessible name, so it is matched by its icon path. */
  readonly closeButton: Locator;
  readonly errorBanner: Locator;
  readonly minPaymentButton: Locator;
  readonly payFullBalanceButton: Locator;
  readonly currentIndebtedness: Locator;

  // Confirmation step
  readonly authorizeButton: Locator;
  readonly backButton: Locator;
  readonly confirmAmount: Locator;
  readonly confirmOrigin: Locator;
  readonly confirmRecipient: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 2 });
    this.fromSelect = page.locator('select#fromAccount');
    this.toSelect = page.locator('select#toAccount');
    this.amountInput = page.locator('input#amount');
    this.reviewButton = page.getByRole('button', { name: 'Review Protocol' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.closeButton = page.locator('button:has(path[d="M6 18L18 6M6 6l12 12"])');
    this.errorBanner = page.locator('form div.text-red-400');
    this.minPaymentButton = page.getByRole('button', { name: 'Min Payment ($25)' });
    this.payFullBalanceButton = page.getByRole('button', { name: 'Pay Full Balance' });
    this.currentIndebtedness = page.getByText('Current Indebtedness').locator('xpath=following-sibling::p');

    this.authorizeButton = page.getByRole('button', { name: /^Authorize (Transfer|Payment)$/ });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.confirmAmount = page.getByText('Amount to Liquidate').locator('xpath=following-sibling::p');
    this.confirmOrigin = page.getByText('Origin Facility', { exact: true }).locator('xpath=following-sibling::p');
    this.confirmRecipient = page.getByText('Recipient Facility', { exact: true }).locator('xpath=following-sibling::p');
  }

  /** Mode label under the title: "Internal Transfer", "Payment Facility" or "Final Authorization". */
  modeLabel(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  async goto() {
    await this.page.goto('/transfer');
    await this.expectOnForm();
  }

  async expectOnForm() {
    await expect(this.page).toHaveURL(/\/transfer$/);
    await expect(this.reviewButton).toBeVisible();
  }

  async expectOnConfirmation() {
    await expect(this.modeLabel('Final Authorization')).toBeVisible();
    await expect(this.authorizeButton).toBeVisible();
  }

  /** Option values (account ids) offered by a select, excluding the disabled placeholder. */
  async optionValues(select: Locator): Promise<string[]> {
    return select.locator('option:not([disabled])').evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value),
    );
  }

  async fillForm({ fromId, toId, amount }: TransferInput) {
    await this.fromSelect.selectOption(fromId);
    await this.toSelect.selectOption(toId);
    await this.amountInput.fill(String(amount));
  }

  async review() {
    await this.reviewButton.click();
  }

  /** Clicks Authorize and waits for the mock API (~800 ms) to land back on the dashboard. */
  async authorize() {
    await this.authorizeButton.click();
    await expect(this.page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  }

  /** Full happy path: fill → review → authorize. */
  async transfer(input: TransferInput) {
    await this.fillForm(input);
    await this.review();
    await this.expectOnConfirmation();
    await this.authorize();
  }

  /** Native HTML constraint validation state of the amount field. */
  async amountValidity() {
    return this.amountInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      rangeUnderflow: el.validity.rangeUnderflow,
      stepMismatch: el.validity.stepMismatch,
      badInput: el.validity.badInput,
    }));
  }
}
