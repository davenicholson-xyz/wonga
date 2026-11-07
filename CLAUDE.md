# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run check` - Type-check with svelte-check
- `npm run lint` - Prettier + ESLint check
- `npm run format` - Auto-format with Prettier
- `npm run db:generate` - Generate a migration in `drizzle/` after changing `schema.ts` (review the SQL, commit it)
- `npm run db:migrate` - Apply pending migrations (this is how production gets schema changes)
- `npm run db:push` - Sync schema straight to a **local dev** database only; refused for production by `drizzle.config.ts`
- `npm run db:studio` - Open Drizzle Studio database UI

No test framework is configured.

## Environments & deployment

Production holds real invoices. Full runbook: [`ops/README.md`](ops/README.md). Rules:

- **Production** is the "webserver" container: code in `/opt/wonga`, PM2 process `wonga` on port 3001, settings in `/etc/wonga/env`, data in `/var/lib/wonga/` (`wonga.db`, `uploads/`). **Development** is "devbox": `~/projects/wonga`, `npm run dev`.
- Never `git pull && npm run build` inside `/opt/wonga` while the app is running. Build in a separate folder and swap `build/` in (see the runbook).
- Build with `DATABASE_URL=:memory: npm run build`. The build opens `DATABASE_URL`, so this keeps it away from real data.
- Run `wonga-backup predeploy` before any production change, and don't deploy between :00 and :10 (the invoice cron runs at :05).
- Schema changes go through `db:generate` → review the SQL → commit → `drizzle-kit migrate` in production. Never `db:push` against production.
- Uploads are read from `UPLOADS_DIR` via `uploadsDir()` in `src/lib/server/paths.ts`. Never build paths from `process.cwd()`.
- Dev email goes to Mailpit (`localhost:1025`, inbox on port 8025). Never put real SMTP settings in a dev `.env`.
- This repository is public: never commit secrets. Every setting is listed in `.env.example`.

## Architecture

**Shyft** is a freelancer finance app (invoicing, income tracking, budgeting, timesheets) built with SvelteKit, Svelte 5, and SQLite.

### Remote Functions (`src/lib/funcs/*.remote.ts`)

The app uses SvelteKit's experimental `remoteFunctions` feature (enabled in `svelte.config.js`). Three function types from `$app/server`:

- **`query()`** - Reactive data fetching. Call without `await`, access data via `.current` property, refresh with `.refresh()`. Do NOT use top-level `await` with queries in components — it causes hydration errors.
- **`form()`** - Form submissions with Valibot validation. Spread onto `<form>` elements with `{...formName}`, access fields via `.fields.fieldName.as('type')`.
- **`command()`** - Imperative server calls with validation. Call directly with `await`.

```svelte
<!-- query pattern -->
const data = get_categories_with_expenses();
const categories = $derived(data.current?.categories ?? []);

<!-- form pattern -->
<form {...create_category}>
  <input {...create_category.fields.name.as('text')} />
</form>

<!-- command pattern -->
await delete_category({ id });
```

### Modal Pattern

Modal components export a `show()` function and use `$state` for visibility with DaisyUI's `modal`/`modal-open` classes. Parent pages register modal controls via Svelte context (`src/lib/context/`) so any descendant can trigger modals without prop drilling.

### Database

SQLite via better-sqlite3 + Drizzle ORM. Schema in `src/lib/server/db/schema.ts`. All tables use `crypto.randomUUID()` for primary keys. `DATABASE_URL` env var points to the SQLite file.

### Styling

Tailwind CSS 4 + DaisyUI 5. Themes configured in `src/app.css`: light (default), dark (prefers-dark), forest, dim, cupcake. Use DaisyUI component classes (`btn`, `modal`, `card`, `form-control`, `input`, `select`, etc.) with `input-sm`/`btn-sm` sizing throughout.

### Key Conventions

- Svelte 5 runes: `$state()`, `$derived()`, `$effect()`, `$props()`, `$bindable()`
- Currency formatting: `formatCurrency()` from `$lib/helpers` (GBP)
- Components organized by feature: `src/lib/components/{budget,invoice,timesheet}/`
- Route params are strings — `parseInt()` when using as numbers
