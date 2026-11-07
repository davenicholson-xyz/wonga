# Operations runbook

How wonga (Shyft) is built, released, backed up and restored. Production holds real invoices:
**release only with `wonga-deploy`, never build or `db:push` in place, and avoid :00–:10**
(the invoice cron runs at :05; `wonga-deploy` refuses to run then).

## Environments

|            | Production ("webserver", Proxmox CT 111)                   | Development ("devbox", Proxmox CT 201)                        |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Code       | `/srv/wonga/current` → `/srv/wonga/releases/<stamp>-<sha>` | `~/projects/wonga` (user `dave`)                              |
| Runs as    | PM2 process `wonga`, port 3001, Node 20                    | `npm run dev` or `npm run dev:prod-data`, Node 20 (`nvm use`) |
| Settings   | `/etc/wonga/env` (root-only, `chmod 600`)                  | `.env` in the repo (gitignored)                               |
| Database   | `/var/lib/wonga/wonga.db`                                  | `local.db`, or the prod copy `~/wonga-data/wonga.db`          |
| Uploads    | `/var/lib/wonga/uploads/`                                  | `uploads/`, or `~/wonga-data/uploads/`                        |
| Email      | Real SMTP                                                  | Mailpit catcher, `localhost:1025`, inbox on port 8025         |
| Public URL | https://shyft.bodgelab.net                                 | -                                                             |

Every setting is listed in [`../.env.example`](../.env.example). `DATABASE_URL`, `UPLOADS_DIR`, `ORIGIN`
and `CRON_SECRET` are required in production; [`../ecosystem.config.cjs`](../ecosystem.config.cjs) loads
`/etc/wonga/env` (or `$WONGA_ENV_FILE`) and refuses to start without them. Never commit real values:
this repository is public.

## Files in this folder

| File                        | Installed at                                              | Purpose                                                    |
| --------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `wonga-deploy`              | webserver `/usr/local/sbin/wonga-deploy` (755)            | Build, rehearse, release and roll back                     |
| `wonga-backup`              | webserver `/usr/local/sbin/wonga-backup` (755)            | Online SQLite backup + uploads archive, 60 days kept       |
| `wonga-backup.cron`         | webserver `/etc/cron.d/wonga-backup` (644)                | Nightly backup at 01:30                                    |
| `send-invoices.crontab`     | webserver root crontab                                    | Hourly invoice auto-send at :05 (fill in the key)          |
| `wonga-refresh-devbox`      | Proxmox host `/usr/local/sbin/wonga-refresh-devbox` (755) | Copies the newest prod backup to devbox `~/wonga-data`     |
| `wonga-refresh-devbox.cron` | Proxmox host `/etc/cron.d/wonga-refresh-devbox` (644)     | Runs that nightly at 01:45                                 |
| `mailpit.service`           | devbox `/etc/systemd/system/mailpit.service`              | Catches all dev email                                      |
| `baseline-migrations.sh`    | run once, by hand                                         | Marks `0000_baseline` applied on a pre-migrations database |

## Releasing to production

Run as root on the webserver:

```sh
wonga-deploy main          # or a tag / commit: wonga-deploy v2026.11.07, wonga-deploy 3642f57
wonga-deploy --list        # releases (* = live), migrations applied, recent deploys
```

What it does, in order. Everything before step 4 leaves the live app untouched, and any failure there
just stops:

1. Clones the ref from GitHub into `/srv/wonga/releases/<stamp>-<sha>`. Reuses the live `node_modules`
   if `package-lock.json` is unchanged, otherwise runs `npm ci`.
2. Builds with `DATABASE_URL=:memory:`.
3. **Rehearses**: copies the live database and uploads, applies any new migrations to the copy, starts the
   new build on port 3097 (email pointed nowhere) and checks the home page and the newest invoice page.
4. Stops the app, runs `wonga-backup predeploy-<sha>`, applies migrations to the live database.
5. Points `/srv/wonga/current` at the new release, starts it, and runs the same health check.
6. **If migrating or the health check fails:** restores the database from step 4's backup (only if
   migrations ran), points `current` back at the previous release and starts it. The failed release is
   kept for inspection.

Downtime is a few seconds (steps 4–5). The last 5 releases are kept. History is in `/srv/wonga/deploy.log`,
and each release records its ref, backup and previous release in `.deploy-info`.

### Rolling back

```sh
wonga-deploy --rollback               # code only: back to the previous release
wonga-deploy --rollback --restore-db  # also restore the backup taken just before the current release
```

`--rollback` refuses if the current release ran migrations, because the older code expects the older
schema. `--restore-db` fixes that by restoring the pre-release backup, which **loses anything written
since that release** (it takes a `before-rollback` backup first). If real invoices were created in the
meantime, prefer fixing forward with a new release.

## Building

```sh
nvm use                    # Node 20, from .nvmrc; npm refuses other versions (engine-strict)
npm ci
DATABASE_URL=:memory: npm run build
```

The build loads `src/lib/server/db/index.ts`, which opens `DATABASE_URL`. Use `:memory:` so a build can
never create or touch a real database.

## Database migrations

- Change `src/lib/server/db/schema.ts`, then `npm run db:generate` (on devbox).
- **Read the generated SQL in `drizzle/`.** Look for `DROP`, or a table being rebuilt (`__new_` tables).
  Commit it with the code.
- Test it: `wonga-refresh-devbox` (or wait for the nightly copy), then
  `DATABASE_URL=~/wonga-data/wonga.db npm run db:migrate` and `npm run dev:prod-data`.
- `wonga-deploy` applies it to production, after rehearsing it on a copy.
- `db:push` is for a throwaway dev database only. `drizzle.config.ts` refuses it when `NODE_ENV=production`
  or the database is under `/var/lib/wonga/`.

## Backups and restoring

`wonga-backup [label]` writes `/var/backups/wonga/wonga-<stamp>-<label>.db.gz` and
`uploads-<stamp>-<label>.tar.gz`, checks the copy's integrity, and keeps 60 days. It runs nightly at 01:30,
and before every release. The 02:00 Proxmox backup of the whole container then takes `/var/backups/wonga`
off the machine.

To restore by hand:

```sh
pm2 stop wonga
cp -a /var/lib/wonga/wonga.db /var/lib/wonga/wonga.db.before-restore
gunzip -c /var/backups/wonga/wonga-<stamp>-<label>.db.gz > /var/lib/wonga/wonga.db
# Uploads too, if needed:
mv /var/lib/wonga/uploads /var/lib/wonga/uploads.before-restore
tar -xzf /var/backups/wonga/uploads-<stamp>-<label>.tar.gz -C /var/lib/wonga
pm2 start wonga
```

If the restored backup is from before a migration, the live code will not match it: roll the code back
too (`wonga-deploy --rollback`), or release a version whose migrations match.

## Installing production from scratch

```sh
# Node 20, PM2, sqlite3, git, python3 installed.
install -d -m 700 /etc/wonga /var/lib/wonga /var/lib/wonga/uploads
cp .env.example /etc/wonga/env && chmod 600 /etc/wonga/env   # then fill in real values
install -m 755 ops/wonga-deploy ops/wonga-backup /usr/local/sbin/
install -m 644 ops/wonga-backup.cron /etc/cron.d/wonga-backup
mkdir -p /srv/wonga
WONGA_ALLOW_ANY_TIME=1 wonga-deploy main   # first release; migrations create the tables
pm2 startup
crontab -e   # add the line from ops/send-invoices.crontab with the real CRON_SECRET
```

A database created before migrations existed (tables made by `db:push`) needs
`ops/baseline-migrations.sh <db> <repo>` once, after checking its structure matches `drizzle/0000_baseline.sql`.

## Development setup (devbox)

1. `nvm install 20` once; `nvm use` in the repo picks it up from `.nvmrc`.
2. `cp .env.example .env`. Keep `SMTP_HOST=localhost` and `SMTP_PORT=1025`: **dev must never have real
   mail settings**, or testing with production data can email real customers.
3. Mailpit: install the binary to `/usr/local/bin/mailpit`, create a `mailpit` system user, and make a
   self-signed certificate for `localhost` in `/etc/mailpit/` (`cert.pem`, `key.pem`). The app always
   connects with TLS. Then install `ops/mailpit.service` and `systemctl enable --now mailpit`.
4. Make Node trust that certificate: `export NODE_EXTRA_CA_CERTS=/etc/mailpit/cert.pem` in `~/.zshenv`.
   Without it, sending fails (safely) with a certificate error.
5. Production data: the Proxmox host's `wonga-refresh-devbox` copies the newest backup into `~/wonga-data`
   (nightly at 01:45, or run it by hand on the host). `npm run dev:prod-data` runs the dev server on it.

## Docker

The `Dockerfile` is an alternative to the PM2 setup above and is not used in production. Its entrypoint
runs `drizzle-kit migrate` and then the app. Mount the database and uploads, and set the variables from
`.env.example`.
