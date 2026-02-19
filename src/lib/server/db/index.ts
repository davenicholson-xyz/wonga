import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(env.DATABASE_URL);

export const db = drizzle(client, { schema });

// Seed default shift patterns if none exist
try {
	const count = client.prepare('SELECT COUNT(*) as c FROM shift_pattern').get() as { c: number };
	if (count.c === 0) {
		client
			.prepare(
				`INSERT INTO shift_pattern (id, title, start_time, end_time, color, icon, sort_order)
      VALUES (?,?,?,?,?,?,?)`
			)
			.run(crypto.randomUUID(), 'Day Shift', '06:00', '16:00', 'warning', '☀️', 0);
		client
			.prepare(
				`INSERT INTO shift_pattern (id, title, start_time, end_time, color, icon, sort_order)
      VALUES (?,?,?,?,?,?,?)`
			)
			.run(crypto.randomUUID(), 'Back Shift', '12:00', '22:00', 'info', '🌙', 1);
	}
} catch {
	/* table not yet created on first db:push */
}
