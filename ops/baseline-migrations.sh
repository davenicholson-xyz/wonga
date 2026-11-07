#!/bin/sh
# Mark drizzle/0000_baseline.sql as already applied on an EXISTING database whose tables
# were created before migrations were used (e.g. via db:push), WITHOUT running it.
# Check first that the database really matches the baseline. Usage: baseline-migrations.sh <db file> <repo dir>
set -eu
DB="$1"; REPO="$2"
SQL="$REPO/drizzle/0000_baseline.sql"
HASH=$(sha256sum "$SQL" | cut -d' ' -f1)
WHEN=$(python3 -c "import json,sys; print(next(e['when'] for e in json.load(open(sys.argv[1]))['entries'] if e['tag']=='0000_baseline'))" "$REPO/drizzle/meta/_journal.json")
EXISTING=$(sqlite3 "$DB" "SELECT count(*) FROM sqlite_master WHERE name='__drizzle_migrations'")
if [ "$EXISTING" != 0 ] && [ "$(sqlite3 "$DB" 'SELECT count(*) FROM __drizzle_migrations')" != 0 ]; then
  echo "already has migration records, not touching it"; sqlite3 "$DB" 'SELECT id, hash, created_at FROM __drizzle_migrations'; exit 1
fi
sqlite3 "$DB" ".timeout 15000" "BEGIN;
CREATE TABLE IF NOT EXISTS \"__drizzle_migrations\" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric);
INSERT INTO \"__drizzle_migrations\" (\"hash\", \"created_at\") VALUES ('$HASH', $WHEN);
COMMIT;"
echo "baselined $DB: hash=${HASH%${HASH#????????}}... created_at=$WHEN"
