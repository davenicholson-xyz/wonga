# Spec for custom-shift-patterns

branch: claude/feature/custom-shift-patterns

## Summary

Replace the hardcoded "Day Shift" and "Back Shift" quick-select buttons in the timesheet entry modal with a dynamic list of user-defined shift patterns. Users can create, edit, and delete shift patterns in the Settings page. Each pattern stores a title, start time, end time, a colour, and an optional icon/emoji. In the day edit modal, these patterns appear as quick-select buttons that pre-fill the start and end time fields.

## Functional Requirements

- A new `shift_pattern` database table stores: `id`, `title`, `start_time`, `end_time`, `color` (hex or DaisyUI colour token), and `icon` (optional emoji/character string)
- The Settings page gains a "Shift Patterns" section where users can:
  - View all existing shift patterns in a list
  - Create a new shift pattern via a form (title, start time, end time, colour, optional icon)
  - Edit an existing shift pattern
  - Delete a shift pattern
- The `TimesheetEntryModal` replaces the hardcoded Day Shift / Back Shift buttons with a row of buttons dynamically rendered from the user's saved shift patterns
- Each shift pattern button displays the pattern's icon (if set) and title, and is styled using the pattern's colour
- Clicking a shift pattern button sets the `startTime` and `endTime` state in the modal to match the pattern's values
- Shift patterns are fetched via a `query()` remote function and available to the modal component
- If no shift patterns are defined, the quick-select row is hidden (no empty state needed in the modal itself)
- Colour input should allow picking from a small set of preset DaisyUI semantic colours (e.g. warning, info, success, error, primary, secondary) rather than a freeform hex picker, for consistency with the existing UI

## Possible Edge Cases

- User deletes all shift patterns — modal should gracefully show no quick-select row
- Long pattern titles may overflow the button — truncate with ellipsis or limit title length
- Many shift patterns could make the button row too wide — consider wrapping or a scrollable row
- Colour token must map correctly to a Tailwind/DaisyUI class at render time
- Existing hardcoded behaviour (Day Shift = 06:00–16:00, Back Shift = 12:00–22:00) should be migrated as default seed data or removed cleanly — confirm with user whether to seed defaults

## Acceptance Criteria

- [ ] `shift_pattern` table exists in the schema with all required fields
- [ ] Settings page has a visible "Shift Patterns" section with create/edit/delete capability
- [ ] Creating a shift pattern with title, start time, end time, colour, and optional icon saves correctly
- [ ] Saved patterns appear immediately in the Settings list after creation (reactive)
- [ ] `TimesheetEntryModal` no longer contains hardcoded Day Shift / Back Shift buttons
- [ ] Dynamic shift pattern buttons appear in the modal and are styled with the correct colour
- [ ] Clicking a pattern button updates the start and end time fields in the modal
- [ ] The calendar dot colour indicator in `CalendarView` correctly reflects the shift pattern colour for a given entry (or falls back gracefully)
- [ ] Deleting a shift pattern from Settings removes it from the modal immediately

## Open Questions

- Should existing entries that used the old hardcoded shifts be migrated, or is this purely additive? use esisting data as hard coded times. new shifts need to be labelled as such
- Should the hardcoded Day Shift / Back Shift be seeded as default shift patterns on first run, or simply removed? keep them
- Should the colour picker use DaisyUI semantic colour tokens (warning, info, etc.) or allow freeform hex input? default colors
- Should shift patterns have a sort/order field so users can control the display order in the modal? yes. draggable order
- Should the calendar dot colour in `CalendarView` be driven by the matched shift pattern colour, and if so how is the match determined (by start time, by pattern id stored on the timesheet entry, or another mechanism)? yes. match the color
