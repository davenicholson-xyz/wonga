# Operations runbook

How wonga (Shyft) is built, released, backed up and restored. Production holds real invoices:
**back up before touching it, never build or `db:push` in place, and avoid deploying between :00 and :10**
(the invoice cron runs at :05).

## Environments

|            | Production ("webserver", Proxmox CT 111)                  | Development ("devbox", Proxmox CT 201)             |
| ---------- | --------------------------------------------------------- | -------------------------------------------------- |
| Code       | `/opt/wonga` (git checkout of `main`)                     | `~/projects/wonga` (user `dave`)                   |
| Runs as    | PM2 process `wonga`, `build/index.js`, port 3001, Node 20 | `npm run dev` (Vite)                               |
| Settings   | `/etc/wonga/env` (root-only, `chmod 600`)                 | `.env` in the repo (gitignored)                    |
| Database   | `/var/lib/wonga/wonga.db`                                 | `local.db`, or a prod copy in `~/wonga-data/`      |
| Uploads    | `/var/lib/wonga/uploads/`                                 | `uploads/`                                         |
| Email      | Real SMTP                                                 | Mailpit catcher, `localhost:1025`, UI on port 8025 |
| Public URL | https://shyft.bodgelab.net                                | -                                                  |

Every setting is listed in [`../.env.example`](../.env.example). `DATABASE_URL`, `UPLOADS_DIR`, `ORIGIN`
and `CRON_SECRET` are required in production; [`../ecosystem.config.cjs`](../ecosystem.config.cjs) loads
`/etc/wonga/env` (or `$WONGA_ENV_FILE`) and refuses to start without them. Never commit real values:
this repository is public.

`/opt/wonga/local.db` and `/opt/wonga/uploads` are symlinks into `/var/lib/wonga`, left so an old build
can still run if rolled back. Nothing should use those paths.

## Files in this folder

| File                     | Installed at                                   | Purpose                                                    |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------- |
| `wonga-backup`           | webserver `/usr/local/sbin/wonga-backup` (755) | Online SQLite backup + uploads archive, 60 days kept       |
| `wonga-backup.cron`      | webserver `/etc/cron.d/wonga-backup` (644)     | Nightly backup at 01:30                                    |
| `send-invoices.crontab`  | webserver root crontab                         | Hourly invoice auto-send at :05 (fill in the key)          |
| `mailpit.service`        | devbox `/etc/systemd/system/mailpit.service`   | Catches all dev email                                      |
| `baseline-migrations.sh` | run once, by hand                              | Marks `0000_baseline` applied on a pre-migrations database |

## Building

```sh
npm ci
DATABASE_URL=:memory: npm run build
```

The build loads `src/lib/server/db/index.ts`, which opens `DATABASE_URL`. Use `:memory:` so a build can
never create or touch a real database. Build with the same Node major version as production (20).

## Database migrations

- Change `src/lib/server/db/schema.ts`, then `npm run db:generate` (on devbox).
- **Read the generated SQL in `drizzle/`.** Look for `DROP`, or a table being rebuilt (`__new_` tables).
  Commit it with the code.
- Production applies it with `drizzle-kit migrate` during a release (below).
- `db:push` is for a throwaway dev database only. `drizzle.config.ts` refuses it when `NODE_ENV=production`
  or the database is under `/var/lib/wonga/`.

## Releasing to production (manual, run as root on the webserver)

```sh
# 0. Not between :00 and :10. Back up first.
wonga-backup predeploy

# 1. Build in a separate folder. The live app is untouched.
rm -rf /root/wonga-build
git clone -q https://github.com/davenicholson-xyz/wonga.git /root/wonga-build
cd /root/wonga-build && git checkout <commit-or-tag>
npm ci                                  # or: cp -a /opt/wonga/node_modules . if package-lock.json is unchanged
DATABASE_URL=:memory: npm run build

# 2. Rehearse on a copy of live data, on a spare port.
T=$(mktemp -d)
sqlite3 /var/lib/wonga/wonga.db ".backup $T/wonga.db"; cp -a /var/lib/wonga/uploads $T/
DATABASE_URL=$T/wonga.db npx drizzle-kit migrate          # only if drizzle/ has new migrations
DATABASE_URL=$T/wonga.db UPLOADS_DIR=$T/uploads PORT=3097 ORIGIN=http://localhost:3097 CRON_SECRET=test \
  node build/index.js & sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3097/invoices/<recent-invoice-number>   # expect 200
kill %1; rm -rf $T

# 3. Switch over (a few seconds of downtime).
pm2 stop wonga
mkdir -p /root/wonga-rollback && rm -rf /root/wonga-rollback/build.prev
mv /opt/wonga/build /root/wonga-rollback/build.prev
git -C /opt/wonga rev-parse HEAD > /root/wonga-rollback/commit.prev
cd /opt/wonga && git fetch -q origin && git checkout -q <commit-or-tag>
npm ci                                  # only if package-lock.json changed
(set -a; . /etc/wonga/env; set +a; npx drizzle-kit migrate)
cp -a /root/wonga-build/build /opt/wonga/build
pm2 restart /opt/wonga/ecosystem.config.cjs --update-env && pm2 save

# 4. Check.
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/invoices/<recent-invoice-number>   # expect 200
pm2 logs wonga --lines 20 --nostream
```

### Rolling back

```sh
pm2 stop wonga
rm -rf /opt/wonga/build && cp -a /root/wonga-rollback/build.prev /opt/wonga/build
git -C /opt/wonga checkout -q "$(cat /root/wonga-rollback/commit.prev)"
# If the release ran a migration, also restore the "predeploy" backup (next section).
pm2 restart /opt/wonga/ecosystem.config.cjs --update-env
```

## Backups and restoring

`wonga-backup [label]` writes `/var/backups/wonga/wonga-<stamp>-<label>.db.gz` and
`uploads-<stamp>-<label>.tar.gz`, checks the copy's integrity, and keeps 60 days. It runs nightly at 01:30;
the 02:00 Proxmox backup of the whole container then takes `/var/backups/wonga` off the machine.

```sh
pm2 stop wonga
cp -a /var/lib/wonga/wonga.db /var/lib/wonga/wonga.db.before-restore
gunzip -c /var/backups/wonga/wonga-<stamp>-<label>.db.gz > /var/lib/wonga/wonga.db
# Uploads too, if needed:
mv /var/lib/wonga/uploads /var/lib/wonga/uploads.before-restore
tar -xzf /var/backups/wonga/uploads-<stamp>-<label>.tar.gz -C /var/lib/wonga
pm2 start wonga
```

## Installing production from scratch

```sh
# Node 20, PM2, sqlite3, git installed.
install -d -m 700 /etc/wonga /var/lib/wonga
cp .env.example /etc/wonga/env && chmod 600 /etc/wonga/env   # then fill in real values
git clone https://github.com/davenicholson-xyz/wonga.git /opt/wonga && cd /opt/wonga
npm ci && DATABASE_URL=:memory: npm run build
(set -a; . /etc/wonga/env; set +a; npx drizzle-kit migrate)   # creates the tables on a new database
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
install -m 755 ops/wonga-backup /usr/local/sbin/wonga-backup
install -m 644 ops/wonga-backup.cron /etc/cron.d/wonga-backup
crontab -e   # add the line from ops/send-invoices.crontab with the real CRON_SECRET
```

A database created before migrations existed (tables made by `db:push`) needs
`ops/baseline-migrations.sh <db> <repo>` once, after checking its structure matches `drizzle/0000_baseline.sql`.

## Development setup (devbox)

1. `cp .env.example .env`. Keep `SMTP_HOST=localhost` and `SMTP_PORT=1025`: **dev must never have real
   mail settings**, or testing with production data can email real customers.
2. Mailpit: install the binary to `/usr/local/bin/mailpit`, create a `mailpit` system user, and make a
   self-signed certificate for `localhost` in `/etc/mailpit/` (`cert.pem`, `key.pem`). The app always
   connects with TLS. Then install `ops/mailpit.service` and `systemctl enable --now mailpit`.
3. Make Node trust that certificate: `export NODE_EXTRA_CA_CERTS=/etc/mailpit/cert.pem` in your shell profile.
   Without it, sending fails (safely) with a certificate error.
4. To test against real data, copy the latest `/var/backups/wonga/wonga-*.db.gz` and `uploads-*.tar.gz`
   from the webserver into `~/wonga-data/`, unpack them, and point `DATABASE_URL` and `UPLOADS_DIR` there.

## Docker

The `Dockerfile` is an alternative to the PM2 setup above and is not used in production. Its entrypoint
runs `drizzle-kit migrate` and then the app. Mount the database and uploads, and set the variables from
`.env.example`.
