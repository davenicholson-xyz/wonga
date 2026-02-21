# Plan: Auto-Send Future-Dated Invoices

## Context
Currently all invoice sending is manual — the user clicks "Email Invoice" on the detail page. When invoices are created with a future date (e.g. end-of-month billing), the user must remember to come back and send them. This feature adds opt-in auto-sending: invoices can be flagged for auto-send, and a cron-callable API endpoint will send eligible invoices at a configured time each day.

## Key Decisions (from spec)
- Invoices must be **opted in** to auto-send (per-invoice flag, not automatic)
- Scheduler is an **external cron job** hitting an API endpoint (not node-cron)
- **Error notification**: email the user if sending fails
- Settings: global enable toggle, send time, require-timesheet toggle

## Changes

### 1. Add `auto_send` column to invoice table
**File:** `src/lib/server/db/schema.ts`
- Add `auto_send: integer('auto_send').notNull().default(0)` to the invoice table (0/1 boolean, same pattern as `paid`/`emailed`)

Then run `npm run db:push` to apply.

### 2. Add auto-send settings queries
**File:** `src/lib/funcs/settings.remote.ts`
- Add `get_auto_send_settings` query — returns `{ enabled: boolean, time: string, require_timesheet: boolean }` from keys `auto_send_enabled`, `auto_send_time`, `auto_send_require_timesheet`
- Add `save_auto_send_settings` command — saves all three keys (same upsert pattern as `save_payment_settings`)

### 3. Add "Invoices" settings tab with auto-send controls
**File:** `src/routes/settings/invoices/+page.svelte` (new)
- Add a new settings page with:
  - Toggle for "Auto-send invoices" (DaisyUI `toggle` component)
  - Time picker for send time (HTML `<input type="time">`)
  - Toggle for "Only auto-send with timesheet attached"
- Follow the same reactive pattern as `src/routes/settings/ui/+page.svelte`: query → $derived → $effect to sync → save on change

**File:** `src/routes/settings/+layout.svelte`
- Add an "Invoices" tab link to the settings nav bar

### 4. Add auto-send toggle to invoice creation form
**File:** `src/lib/funcs/invoices.remote.ts`
- Add `auto_send` to `create_invoice` form schema and insert
- Add `auto_send` to `get_invoice` query select
- Add `auto_send` to `get_invoices` query select

**File:** `src/routes/invoices/new/+page.svelte` — add a checkbox/toggle for "Auto-send on invoice date" that appears when the invoice date is in the future and auto-send is globally enabled. Add a hidden input bound to `create_invoice.fields.auto_send` in the form's hidden inputs section.

### 5. Add auto-send toggle to invoice detail page
**File:** `src/routes/invoices/[number]/+page.svelte`
- Show an indicator in the header status area when `inv.auto_send` is set (e.g. a clock icon with "Auto-send scheduled")
- Add a toggle or button to enable/disable auto-send for this invoice (calls a new command)

**File:** `src/lib/funcs/invoices.remote.ts`
- Add `toggle_auto_send` command that flips the `auto_send` flag

### 6. Add auto-send indicator to invoice cards
**File:** `src/lib/components/invoice/InvoiceCard.svelte`
- Show a small clock icon when `invoice.auto_send` is truthy (similar to existing emailed/timesheet indicators)

### 7. Create the cron API endpoint
**File:** `src/routes/api/cron/send-invoices/+server.ts` (new)
- `GET` handler (simple for cron tools like `curl`)
- Verify a shared secret from query param or header (e.g. `?key=CRON_SECRET` matched against `env.CRON_SECRET`) to prevent unauthorized triggering
- Logic:
  1. Read `auto_send_enabled` setting — if not enabled, return early
  2. Read `auto_send_time` setting (e.g. "09:00")
  3. Read `auto_send_require_timesheet` setting
  4. Query invoices where: `auto_send = 1 AND emailed = 0 AND invoice_date <= today`
  5. If `require_timesheet` is on, filter out invoices without `timesheet_image`
  6. For each eligible invoice, reuse the sending logic from `send_invoice` (extract into a shared helper `src/lib/server/send-invoice.ts`)
  7. On failure, send an error notification email to `SMTP_FROM`
  8. Return JSON summary of what was sent/skipped/failed

### 8. Extract send logic into shared helper
**File:** `src/lib/server/send-invoice.ts` (new)
- Move the core email sending logic (PDF generation, attachment building, SMTP transport, marking as emailed) from `send_invoice` command into a reusable `sendInvoiceEmail(invoice_number: number)` function
- Both `send_invoice` command and cron endpoint call this shared function
- This avoids duplicating the PDF generation, SMTP config, and attachment handling

## Files Modified
- `src/lib/server/db/schema.ts` — add `auto_send` column
- `src/lib/funcs/settings.remote.ts` — add auto-send settings query/command
- `src/lib/funcs/invoices.remote.ts` — add `auto_send` to queries, add `toggle_auto_send` command
- `src/routes/settings/+layout.svelte` — add Invoices tab
- `src/routes/settings/invoices/+page.svelte` — new settings page
- `src/routes/invoices/[number]/+page.svelte` — auto-send indicator + toggle
- `src/lib/components/invoice/InvoiceCard.svelte` — auto-send icon on cards
- `src/lib/server/send-invoice.ts` — extracted shared send logic
- `src/routes/api/cron/send-invoices/+server.ts` — cron endpoint
- `src/routes/invoices/new/+page.svelte` — auto-send checkbox

## Verification
1. `npm run db:push` — schema changes apply
2. `npm run check` — no type errors
3. `npm run dev` — test manually:
   - Settings > Invoices tab shows toggles and time picker
   - Creating an invoice with future date shows auto-send option
   - Invoice detail page shows auto-send status and toggle
   - Invoice cards show clock icon for auto-send invoices
4. `curl http://localhost:5173/api/cron/send-invoices?key=<secret>` — endpoint processes eligible invoices
