# Spec for budget-income-month-selector

branch: claude/feature/budget-income-month-selector

## Summary
- The budget page currently displays income from next month by default
- Add a month selector so the user can view income from any other month
- Only months that have at least one income entry should appear as options

## Functional Requirements
- The budget page defaults to showing income for next month (existing behaviour preserved)
- A dropdown/selector control appears near the income section of the budget page
- The selector is populated only with months that have at least one income record in the database
- Selecting a month updates the income displayed on the budget page to reflect that month's income
- The currently selected month is visually indicated in the selector

## Possible Edge Cases
- No income records exist at all — selector should be hidden or show a helpful empty state
- Only one month has income — selector can still be shown but offers no other choice
- The default "next month" has no income — selector should still default to next month, but it may not appear as an option
- Very old or future months with income should still appear in the list

## Acceptance Criteria
- The budget page renders a month selector that lists only months with income data
- The selector defaults to next month on page load (matching current behaviour)
- Changing the selector updates the displayed income without a full page reload
- If next month has no income, the selector still defaults to it but the income section reflects zero/empty
- Months are displayed in a human-readable format (e.g. "February 2026") and ordered chronologically

## Open Questions
- Should the selector appear inline near the income heading, or in a page-level controls area? it should show when the income card is clicked
- Should the selected month persist across page navigations (e.g. stored in URL params or local state only)? it shouldnt persist. always return to default
- When a non-default month is selected, should the budget calculations (e.g. remaining budget) also update to use that month's income? yes. update everything with the months income. mnake it obvious it is not the next income month
