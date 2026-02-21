# Plan: Settings Sub-Routes Refactor

## Context
The settings page is a 1,140-line monolith (`src/routes/settings/+page.svelte`) containing six unrelated tabs managed by local `$state`. Each tab is an independent concern with its own remote functions, forms, and UI. Splitting into sub-routes gives each section its own URL, makes files maintainable, and allows deep-linking. Customers will move to a top-level `/customers` route as they are a core data entity. Navigation uses horizontal tabs (matching existing app style).

## New File Structure

```
src/routes/
├── settings/
│   ├── +layout.svelte          NEW — shared horizontal tab nav
│   ├── +page.server.ts         NEW — redirects to /settings/payment
│   ├── payment/
│   │   └── +page.svelte        NEW — extracted from settings monolith
│   ├── rates/
│   │   └── +page.svelte        NEW — extracted from settings monolith
│   ├── shifts/
│   │   └── +page.svelte        NEW — extracted from settings monolith
│   ├── ui/
│   │   └── +page.svelte        NEW — extracted from settings monolith
│   └── data/
│       └── +page.svelte        NEW — extracted from settings monolith
│   (export/ and import/ server routes stay untouched)
├── customers/
│   └── +page.svelte            NEW — extracted customers section
└── +layout.svelte              EDIT — update nav active-state logic, add Customers link
```

The old `src/routes/settings/+page.svelte` is deleted once all content is extracted.

## Step 1 — Create `src/routes/settings/+layout.svelte`

Shared layout wrapping all settings sub-pages. Contains:
- A horizontal tab bar with links: Payment · Rates · Shifts · UI · Data
- Active tab derived from `page.url.pathname` (use `$derived` + `page` from `$app/state`)
- `{@render children()}` below the tabs
- Tabs styled consistently with the rest of the app (DaisyUI `tabs` or simple styled links)

## Step 2 — Create `src/routes/settings/+page.server.ts`

A `load` function that throws `redirect(302, '/settings/payment')` so navigating to `/settings` always lands on a sensible default.

## Step 3 — Extract each settings sub-page

Move the relevant script block variables and template markup from the monolith into each new `+page.svelte`. Each page is self-contained with its own remote function imports.

- **`payment/+page.svelte`** — payment_name, account_number, sort_code, address, email form + save logic
- **`rates/+page.svelte`** — hourly_rate field + save logic
- **`shifts/+page.svelte`** — shift patterns list, drag-to-reorder, create/edit/delete modals (all modal state stays local)
- **`ui/+page.svelte`** — theme picker grid + image size radio group
- **`data/+page.svelte`** — export download link, import file picker + confirmation modal, calendar sync section

Remote functions used by each page stay the same — no changes to `src/lib/funcs/`.

## Step 4 — Create `src/routes/customers/+page.svelte`

Extract the customers tab content: customer list, edit modal, delete confirmation modal. Imports `get_customers`, `update_customer`, `delete_customer` from the customers remote file.

## Step 5 — Update `src/routes/+layout.svelte`

- Update the Settings nav item active-state check from `pathname === '/settings'` to `pathname.startsWith('/settings')` so the tab stays highlighted across all sub-routes
- Add a Customers nav item pointing to `/customers`, highlighted when `pathname.startsWith('/customers')`
- Bottom nav will now have 5 items (Timesheet, Invoices, Budget, Customers, Settings)

## Step 6 — Delete the monolith

Remove `src/routes/settings/+page.svelte` once all content has been extracted and verified.

## Files to Modify
- `src/routes/+layout.svelte` — nav update
- `src/routes/settings/+page.svelte` — delete

## Files to Create
- `src/routes/settings/+layout.svelte`
- `src/routes/settings/+page.server.ts`
- `src/routes/settings/payment/+page.svelte`
- `src/routes/settings/rates/+page.svelte`
- `src/routes/settings/shifts/+page.svelte`
- `src/routes/settings/ui/+page.svelte`
- `src/routes/settings/data/+page.svelte`
- `src/routes/customers/+page.svelte`

## Verification

1. `npm run dev`
2. Navigate to `/settings` — should redirect to `/settings/payment`
3. Confirm all 5 tabs are visible and each loads its section
4. Test each settings section works: save payment details, change hourly rate, create/edit/delete a shift pattern, change theme, export/import data, copy calendar URL
5. Navigate to `/customers` — customer list visible, edit and delete work
6. Check bottom nav highlights correctly for `/settings/*` and `/customers`
7. `npm run check` — no type errors
