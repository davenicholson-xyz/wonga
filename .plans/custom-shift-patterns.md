# Plan: Custom Shift Patterns

## Context

The app currently has two hardcoded shift preset buttons ("Day Shift" and "Back Shift") in the timesheet entry modal, and the calendar view uses hardcoded start-time comparisons to colour the shift dot indicators. This feature replaces both with a user-defined, ordered list of shift patterns, manageable from the Settings page.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/server/db/schema.ts` | Add `shift_pattern` table |
| `src/lib/server/db/index.ts` | Seed default Day/Back Shift patterns on first run |
| `src/lib/funcs/shift_patterns.remote.ts` | **New file** – all CRUD remote functions |
| `src/routes/settings/+page.svelte` | Add "Shift Patterns" tab section |
| `src/lib/components/timesheet/TimesheetEntryModal.svelte` | Replace hardcoded buttons with dynamic pattern buttons |
| `src/lib/components/timesheet/CalendarView.svelte` | Match entry times to pattern for dot colour |

---

## Step 1 – Schema

Add to `src/lib/server/db/schema.ts`:

```ts
export const shift_pattern = sqliteTable('shift_pattern', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time').notNull(),
  color: text('color').notNull().default('primary'), // DaisyUI token: primary|secondary|success|error|warning|info
  icon: text('icon'),           // optional emoji/character
  sort_order: integer('sort_order').notNull().default(0)
});
```

After editing schema, run: `npm run db:push`

---

## Step 2 – Seed Defaults

In `src/lib/server/db/index.ts`, after the `drizzle()` call, add idempotent seed logic:

```ts
try {
  const count = client.prepare('SELECT COUNT(*) as c FROM shift_pattern').get() as { c: number };
  if (count.c === 0) {
    client.prepare(`INSERT INTO shift_pattern (id, title, start_time, end_time, color, icon, sort_order)
      VALUES (?,?,?,?,?,?,?)`).run(crypto.randomUUID(), 'Day Shift', '06:00', '16:00', 'warning', '☀️', 0);
    client.prepare(`INSERT INTO shift_pattern (id, title, start_time, end_time, color, icon, sort_order)
      VALUES (?,?,?,?,?,?,?)`).run(crypto.randomUUID(), 'Back Shift', '12:00', '22:00', 'info', '🌙', 1);
  }
} catch { /* table not yet created on first db:push */ }
```

---

## Step 3 – Remote Functions (`src/lib/funcs/shift_patterns.remote.ts`)

New file with:

- **`get_shift_patterns`** – `query()` → `db.query.shift_pattern.findMany({ orderBy: asc(shift_pattern.sort_order) })`
- **`create_shift_pattern`** – `form()` with `{ title, start_time, end_time, color, icon? }` validation. Assigns `sort_order = max + 1`. Calls `get_shift_patterns().refresh()`.
- **`update_shift_pattern`** – `command()` with `{ id, title, start_time, end_time, color, icon? }`. Calls `.refresh()`.
- **`delete_shift_pattern`** – `command()` with `{ id }`. Calls `.refresh()`.
- **`reorder_shift_patterns`** – `command()` with `{ ids: string[] }` (ordered array). Updates `sort_order` for each id using its array index. Calls `.refresh()`.

---

## Step 4 – Settings Page

Add a **"Shift Patterns"** tab to `src/routes/settings/+page.svelte` (alongside Payment Details, Rates, Customers, etc.).

**List UI:** Each pattern row shows:
- Drag handle (⠿) — `draggable="true"` with `ondragstart`/`ondragover`/`ondrop` handlers using HTML5 Drag and Drop API
- Icon + Title
- Colour swatch (small circle)
- Start–End times
- Edit button → opens inline edit form (same row expands)
- Delete button

**Create form** (below list): title, start time, end time, colour picker (6 coloured swatches: primary, secondary, success, error, warning, info — click to select, highlighted border on active), icon input (single character/emoji, optional). Uses `create_shift_pattern` form.

**Colour swatch helper** (to avoid Tailwind purging dynamic classes):
```ts
const COLOR_CLASSES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
};
```

**Drag-and-drop reorder:** On `ondrop`, recompute the `ids` order locally and call `await reorder_shift_patterns({ ids })`. Optimistic local reorder before server confirms.

---

## Step 5 – TimesheetEntryModal

In `src/lib/components/timesheet/TimesheetEntryModal.svelte`:

1. Import `get_shift_patterns` and call it (no `await` — reactive query).
2. Replace the hardcoded Day/Back Shift buttons block with:

```svelte
{#if patterns.length > 0}
  <div class="flex flex-wrap gap-2 mt-3">
    {#each patterns as p (p.id)}
      <button
        type="button"
        class="btn btn-outline btn-sm grow {BTN_COLOR_CLASSES[p.color]}"
        onclick={() => { startTime = p.start_time; endTime = p.end_time; }}
      >
        {#if p.icon}<span>{p.icon}</span>{/if}
        <span class="truncate max-w-24">{p.title}</span>
      </button>
    {/each}
  </div>
{/if}
```

**BTN_COLOR_CLASSES** lookup (prevents Tailwind purging):
```ts
const BTN_COLOR_CLASSES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  error: 'btn-error',
  warning: 'btn-warning',
  info: 'btn-info',
};
```

3. Remove `setDayShift()` and `setBackShift()` functions.
4. Keep default `startTime = '06:00'` and `endTime = '16:00'` for new entries (unchanged UX).

---

## Step 6 – CalendarView

In `src/lib/components/timesheet/CalendarView.svelte`:

1. Import `get_shift_patterns`.
2. Build a map keyed by `${start_time}-${end_time}` → color token.
3. Replace the hardcoded dot class logic:

```svelte
<!-- Before -->
class:bg-warning={cell.entry?.start_time === '06:00'}
class:bg-info={cell.entry && cell.entry.start_time !== '06:00'}

<!-- After -->
class={dotClass(cell.entry)}
```

```ts
const DOT_BG_CLASSES = { primary: 'bg-primary', secondary: 'bg-secondary',
  success: 'bg-success', error: 'bg-error', warning: 'bg-warning', info: 'bg-info' };

function dotClass(entry?: Entry): string {
  if (!entry) return 'invisible';
  const key = `${entry.start_time}-${entry.end_time}`;
  const color = patternByTime.get(key);
  return color ? (DOT_BG_CLASSES[color] ?? 'bg-base-content/30') : 'bg-base-content/30';
}
```

---

## Verification

1. Run `npm run db:push` → confirm `shift_pattern` table created
2. Start dev server (`npm run dev`) → Day Shift and Back Shift seeded automatically
3. Open Settings → confirm "Shift Patterns" tab appears with the two defaults
4. Create a new pattern (e.g. "Night Shift", 22:00–06:00, success/green, 🌃) → appears immediately in list
5. Edit a pattern title → list updates reactively
6. Drag to reorder → order persists on page refresh
7. Delete a pattern → removed from list and from modal buttons
8. Open TimesheetEntryModal → dynamic buttons appear with correct colours and icons
9. Click a pattern button → start/end time fields update
10. Open CalendarView → dots match the colour of the shift pattern for that entry's times
11. Delete all custom patterns → modal shows no quick-select row (row hidden)
