# Katalian Bank — Playwright E2E: Balance Transfers

End-to-end coverage for `/transfer` (TransferScreen.tsx + `handleTransfer` in App.tsx).

## Run

```bash
npm install
npx playwright install chromium

npm test                 # runs against https://katalian-banking.vercel.app
npm run test:ui          # interactive UI mode
npm run report           # open the HTML report
```

To target another deployment (e.g. a local dev server), set `BASE_URL`:

```bash
BASE_URL=http://localhost:5173 npm test                                  # macOS / Linux
$env:BASE_URL="http://localhost:5173"; npx playwright test               # PowerShell
```

The app keeps all state in `localStorage`, and every Playwright test gets a fresh
browser context, so each test starts from the app's seed data.

## Layout

```
Katalian_Bank_Playwright_Project/
├── playwright.config.ts
├── (fixtures)                  # defined inside each spec so Katalon TestOps can discover tests
├── pages/                      # LoginPage, DashboardPage, TransferPage
├── support/
│   ├── testData.ts             # seed user, accounts, error messages, usd() formatter
│   └── storage.ts              # read balances from / patch accounts in localStorage
└── tests/transfer/
    ├── transfer-execution.spec.ts    # deposit ↔ deposit transfers, confirmation, double-submit
    ├── credit-card-payment.spec.ts   # payment mode, Min Payment / Pay Full Balance
    ├── validation.spec.ts            # account selection rules, amount validation
    ├── navigation.spec.ts            # auth guard, entry points, Cancel / X / Back
    ├── persistence.spec.ts           # reload, sign-out/in, sequential transfers
    └── known-issues.spec.ts          # current defects, marked test.fail()
```

Balances are asserted twice: on the dashboard UI and in the persisted session
(`katalian_session_v1`), which catches display/state mismatches.

## Known issues (`known-issues.spec.ts`)

Each test asserts the *expected* behaviour and is wrapped in `test.fail()`, so the
suite is green today. When a fix ships, Playwright reports "Expected to fail, but
passed" — delete the `test.fail()` line and it becomes a normal regression test.

| Test | Current behaviour |
|---|---|
| Frozen account as origin | Origin list filters by type only; frozen accounts are still selectable |
| Overpaying a credit card | No cap vs. card debt; card balance goes negative (product decision) |
| Ledger entries | Transfers update balances but never add a transaction |
| Cent precision | e.g. `5345.54 - 0.02` is stored as `5345.5199999999995` |
| Net liquidity | Dashboard adds card debt as an asset, so paying a card lowers "net liquidity" |
| Close (X) accessibility | Icon-only button with no `aria-label` |

## Notes

- The amount input is `type=number required min=0.01 step=0.01`, so empty, zero,
  negative and sub-cent amounts are blocked by native browser validation. The
  validation tests assert `input.validity` flags rather than an error banner;
  the app's own "Valid capital amount required." branch is effectively unreachable.
- Selectors rely on element ids (`#fromAccount`, `#toAccount`, `#amount`), labels,
  and button text. Adding `data-testid`s to the account tiles and error banner
  would make `DashboardPage` and `TransferPage` sturdier.
- The root `tsconfig.json` includes `./**/*.ts`; add `"e2e/**/*"` to its
  `exclude` so `npm run build` (tsc) doesn't type-check the test folder.
