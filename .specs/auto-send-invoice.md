# Spec for Auto Send Invoice

branch: claude/feature/auto-send-invoice

## Summary
- When an invoice is created with a future invoice date, automatically send it via email at a configured time on that date
- A global setting controls whether auto-send is enabled and what time of day invoices should be sent
- An additional setting controls whether auto-send should only trigger if a timesheet image is attached to the invoice

## Functional Requirements
- Add settings under the existing settings area for:
  - **Auto-send enabled** — a toggle to activate/deactivate the auto-send feature
  - **Auto-send time** — a time picker for the time of day invoices should be sent (e.g. 09:00)
  - **Require timesheet** — a toggle that, when enabled, only auto-sends invoices that have a timesheet image attached
- When an invoice is created with an `invoice_date` in the future, it should be marked as eligible for auto-send
- A scheduled process should run periodically and, when the current date/time passes the configured send time on an invoice's `invoice_date`, automatically send the invoice using the existing `send_invoice` logic
- If "require timesheet" is enabled and the invoice has no timesheet image, the invoice should not be auto-sent
- Invoices that have already been emailed should never be auto-sent again
- Invoices with a past or current `invoice_date` at the time of creation should not be queued for auto-send
- The invoice detail page should indicate if an invoice is pending auto-send

## Possible Edge Cases
- Invoice is created with a future date but the auto-send setting is later disabled before that date — the invoice should not be sent
- Invoice is manually sent before the auto-send date — the auto-send should skip it since `emailed` is already set
- The auto-send time has already passed for today when an invoice is created with today's date — should not auto-send
- Timesheet image is attached after invoice creation but before the auto-send date — should be picked up if require-timesheet is enabled
- Multiple invoices are due to be sent at the same time — all should be sent
- Email sending fails — the invoice should remain unsent and be retried on the next scheduled check

## Acceptance Criteria
- Settings page shows auto-send toggle, time picker, and require-timesheet toggle
- Creating an invoice with a future date queues it for auto-send when the feature is enabled
- Invoices are automatically emailed at the configured time on their invoice date
- Invoices without a timesheet image are skipped when require-timesheet is enabled
- Already-emailed invoices are never sent again
- Invoice detail page shows a visual indicator for pending auto-send
- Disabling the auto-send setting prevents all future auto-sends

## Open Questions
- Should there be a per-invoice override to opt out of auto-send? yes. invoices must be opted into auto send
- What mechanism should be used for the scheduled process (e.g. node-cron within the server, external cron job, or a polling interval)? external cron job... provide instructions
- Should there be a log or notification when an auto-send succeeds or fails? yes. email the user (me) if any issues
