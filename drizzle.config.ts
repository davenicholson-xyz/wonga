import { resolve } from 'path';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// `db:push` rewrites tables directly and can drop data. Never allow it against production:
// production schema changes go through `db:generate` -> review the SQL -> `db:migrate`.
const isPush = process.argv.includes('push');
const isProdDb =
	process.env.NODE_ENV === 'production' ||
	resolve(process.env.DATABASE_URL).startsWith('/var/lib/wonga/');
if (isPush && isProdDb) {
	throw new Error(
		'Refusing to run drizzle-kit push against the production database. Use db:generate + db:migrate.'
	);
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
