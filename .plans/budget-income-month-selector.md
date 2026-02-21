# Plan: Budget Income Month Selector

## Context
The budget page shows income figures used for budgeting calculations (remaining balance, spending progress, etc.). Invoices due in a given month (e.g. February) represent income that becomes available the following month (March). So the page correctly fetches the current month's invoices and labels them as "next month Income" — this is intentional, not a bug. The user wants to add a month selector so they can view income from any other invoice month, not just the current one. Selecting a different month should update all budget calculations, and it should be visually obvious when a non-default month is selected. The selection does not persist across page loads.

## Files to Change

- `src/lib/funcs/income.remote.ts` — add new query
- `src/routes/budget/+page.svelte` — add reactive state, wire up new data
- `src/lib/components/budget/BudgetStats.svelte` — add month selector UI and visual indicator

## Step 1 — Add `get_income_months()` to income.remote.ts

Add a new parameterless `query()` that returns all distinct month/year pairs from the `invoice` table, sorted chronologically. Fetch only the `due_date` column and compute distinct months in JS (dataset is small for a freelancer app).

Returns: `{ month: number, year: number }[]` — only invoice months with at least one invoice, in ascending order.

## Step 2 — Add reactive state in +page.svelte

The existing default (`current_month` / `current_year`) is correct and should not change.

**Add reactive state** for the selected invoice month:
```
let selected_month = $state(current_month)
let selected_year  = $state(current_year)
```

**Update income query** to use reactive state values:
```
const income_data = get_income_for({ month: selected_month, year: selected_year })
```
Svelte 5 fine-grained reactivity will re-run the query when either state value changes.

**Import and call** `get_income_months()` — no params, reactive.

**Pass to BudgetStats:**
- `selected_month`, `selected_year` (the invoice month being viewed)
- `default_month`, `default_year` (= `current_month` / `current_year`, for comparison)
- `available_months` (from `get_income_months().current ?? []`)
- `on_month_change` callback that sets `selected_month` and `selected_year`

## Step 3 — Update BudgetStats.svelte

**New props** (via `$props()`): `selected_month`, `selected_year`, `default_month`, `default_year`, `available_months`, `on_month_change`.

**Income card becomes a DaisyUI dropdown trigger:**
- Wrap the income card div in a `<div class="dropdown">`
- The card itself is the trigger (add `tabindex="0"` role)
- Below it, render a `<ul class="dropdown-content menu ...">` listing available months
- Each `<li>` is labeled as the **income availability month** (invoice month + 1, e.g. February invoices → "March 2026"); clicking calls `on_month_change` with that invoice month/year and closes the dropdown
- Use `$state` for open/close toggle

**Month label** continues to show the income availability month (invoice month + 1), now using the selected values:
```
new Date(selected_year, selected_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
```
(Note: `selected_month` is already 1-indexed, so passing it directly to `Date` constructor gives month+1 — matching the existing label logic.)

**Non-default month indicator:**
- Derive `is_default = selected_month === default_month && selected_year === default_year`
- When `!is_default`: change income card background from `bg-info` to `bg-warning` and add a small label (e.g. "Not current period") so it's visually obvious

## Verification

1. `npm run dev` — start dev server
2. Navigate to `/budget`
3. Confirm income card still shows next month's name with the same income figure as before (no behavioural change to default)
4. Click income card — dropdown appears listing only months that have invoices, labeled as their income availability month
5. Select a different month — income figure updates, remaining balance updates, progress bar updates
6. Income card turns warning colour and shows the non-default indicator
7. Refresh page — resets to the default (current month invoices / next month label)
