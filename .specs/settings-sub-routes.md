# Spec for settings-sub-routes

branch: claude/feature/settings-sub-routes

## Summary
- The settings page is a single 1,140-line file with six unrelated tabs (Payment, Rates, Shift Patterns, Customers, UI, Data)
- Split each tab into its own sub-route under `/settings/` for better maintainability and URL addressability
- Add a shared settings layout with a sidebar or top nav to navigate between sub-pages

## Functional Requirements
- Each settings section becomes its own route: `/settings/payment`, `/settings/rates`, `/settings/shifts`, `/settings/customers`, `/settings/ui`, `/settings/data`
- Navigating to `/settings` redirects to a sensible default (e.g. `/settings/payment`)
- A persistent navigation element (sidebar or top tabs) is present on all settings sub-pages and highlights the active section
- All existing functionality within each tab is preserved exactly — no behaviour changes
- Deep-linking to a sub-route loads directly into that section without needing to navigate from a parent

## Possible Edge Cases
- Browser back/forward navigation should work correctly between sub-routes
- The active nav item should be derived from the current URL, not local state
- If a user bookmarks `/settings/customers` it should load that section directly

## Acceptance Criteria
- `/settings` redirects to a default sub-route
- Each of the 6 sections is accessible via its own URL
- The settings nav shows the correct active state for each route
- All existing settings functionality works identically after the refactor
- No single settings file exceeds a reasonable size (the 1,140-line monolith is gone)

## Open Questions
- Should `Customers` remain under `/settings/customers` or move to a top-level `/customers` route? (It is a core data entity, not really a preference)
- Should the nav be a sidebar (desktop) or horizontal tabs (mobile-first)?
