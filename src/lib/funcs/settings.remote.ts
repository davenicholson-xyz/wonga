import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { settings } from '$lib/server/db/schema';
import * as v from 'valibot';

export const set_settings = command(
	v.object({
		key: v.string(),
		value: v.string()
	}),
	async ({ key, value }) => {
		await db
			.insert(settings)
			.values({ key, value })
			.onConflictDoUpdate({ target: settings.key, set: { value } });
	}
);

export const get_settings = query(
	v.object({
		key: v.string()
	}),
	async ({ key }) => {
		const result = await db.select().from(settings).where(eq(settings.key, key)).execute();
		return result[0];
	}
);
