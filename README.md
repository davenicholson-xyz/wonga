# Shyft (wonga)

A freelancer finance app for invoicing, timesheets, income and budgeting. Built with SvelteKit, Svelte 5,
SQLite (better-sqlite3 + Drizzle ORM), Tailwind CSS 4 and DaisyUI 5.

## Running it locally

```sh
nvm use                 # Node 20
cp .env.example .env    # dev settings; email goes to a local Mailpit, never a real server
npm ci
npm run db:migrate      # create the tables in a fresh local.db
npm run dev
```

## Useful commands

| Command                               | What it does                                                    |
| ------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                         | Dev server                                                      |
| `npm run dev:prod-data`               | Dev server on the nightly copy of production data               |
| `npm run check`                       | Type-check                                                      |
| `npm run lint`                        | Prettier + ESLint                                               |
| `DATABASE_URL=:memory: npm run build` | Production build                                                |
| `npm run db:generate`                 | Create a migration after changing `src/lib/server/db/schema.ts` |
| `npm run db:migrate`                  | Apply migrations                                                |

## Production

Release with `wonga-deploy <ref>` on the webserver. Releases, rollbacks, migrations, backups and restores are covered in [`ops/README.md`](ops/README.md).
