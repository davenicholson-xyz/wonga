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

export const get_rate_settings = query(async () => {
	const row = await db.select().from(settings).where(eq(settings.key, 'hourly_rate')).execute();
	return {
		hourly_rate: row[0] ? parseFloat(row[0].value) : 30
	};
});

export const save_rate_settings = command(
	v.object({
		hourly_rate: v.number()
	}),
	async ({ hourly_rate }) => {
		await db
			.insert(settings)
			.values({ key: 'hourly_rate', value: hourly_rate.toString() })
			.onConflictDoUpdate({ target: settings.key, set: { value: hourly_rate.toString() } });
	}
);

export const get_theme_setting = query(async () => {
	const row = await db.select().from(settings).where(eq(settings.key, 'theme')).execute();
	return {
		theme: row[0]?.value ?? 'dim'
	};
});

export const save_theme_setting = command(
	v.object({
		theme: v.string()
	}),
	async ({ theme }) => {
		await db
			.insert(settings)
			.values({ key: 'theme', value: theme })
			.onConflictDoUpdate({ target: settings.key, set: { value: theme } });
	}
);

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

export const get_image_size_setting = query(async () => {
	const row = await db.select().from(settings).where(eq(settings.key, 'image_size')).execute();
	return {
		image_size: (row[0]?.value as 'small' | 'medium' | 'large') ?? 'medium'
	};
});

export const save_image_size_setting = command(
	v.object({
		size: v.picklist(['small', 'medium', 'large'])
	}),
	async ({ size }) => {
		await db
			.insert(settings)
			.values({ key: 'image_size', value: size })
			.onConflictDoUpdate({ target: settings.key, set: { value: size } });
	}
);
