import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { eq, inArray } from 'drizzle-orm';
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

export const get_payment_settings = query(async () => {
	const keys = ['payment_name', 'account_number', 'sort_code', 'address', 'email'];
	const rows = await db.select().from(settings).where(inArray(settings.key, keys)).execute();
	const map: Record<string, string> = {};
	for (const row of rows) map[row.key] = row.value;
	return {
		payment_name: map['payment_name'] ?? '',
		account_number: map['account_number'] ?? '',
		sort_code: map['sort_code'] ?? '',
		address: map['address'] ?? '',
		email: map['email'] ?? ''
	};
});

export const save_payment_settings = command(
	v.object({
		payment_name: v.string(),
		account_number: v.string(),
		sort_code: v.string(),
		address: v.string(),
		email: v.string()
	}),
	async ({ payment_name, account_number, sort_code, address, email }) => {
		const entries = [
			{ key: 'payment_name', value: payment_name },
			{ key: 'account_number', value: account_number },
			{ key: 'sort_code', value: sort_code },
			{ key: 'address', value: address },
			{ key: 'email', value: email }
		];
		for (const { key, value } of entries) {
			await db
				.insert(settings)
				.values({ key, value })
				.onConflictDoUpdate({ target: settings.key, set: { value } });
		}
	}
);
