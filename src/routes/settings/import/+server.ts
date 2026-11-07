import { db } from '$lib/server/db';
import {
	customer,
	invoice,
	income,
	settings,
	category,
	expense,
	timesheet,
	shift_pattern
} from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type Row = Record<string, unknown>;

const TABLE_KEYS = [
	'customers',
	'invoices',
	'income',
	'settings',
	'categories',
	'expenses',
	'timesheets',
	'shift_patterns'
] as const;

export const POST: RequestHandler = async ({ request }) => {
	let data: Record<string, unknown>;
	try {
		data = await request.json();
	} catch {
		return json({ error: 'Backup file is not valid JSON' }, { status: 400 });
	}

	if (!data || typeof data !== 'object' || !data.version || !data.exported_at) {
		return json({ error: 'Invalid backup file' }, { status: 400 });
	}
	for (const key of TABLE_KEYS) {
		if (data[key] !== undefined && !Array.isArray(data[key])) {
			return json({ error: `Invalid backup file: "${key}" is not a list` }, { status: 400 });
		}
	}

	const rows = (key: (typeof TABLE_KEYS)[number]) => (data[key] as Row[] | undefined) ?? [];

	try {
		// One transaction: if any insert fails, every delete is rolled back and the
		// database is left exactly as it was. (better-sqlite3 transactions are synchronous.)
		db.transaction((tx) => {
			// Clear tables in foreign-key order
			tx.delete(expense).run();
			tx.delete(category).run();
			tx.delete(income).run();
			tx.delete(invoice).run();
			tx.delete(customer).run();
			tx.delete(settings).run();
			tx.delete(timesheet).run();
			// Older backups have no shift_patterns key: keep the current patterns for those.
			if (Array.isArray(data.shift_patterns)) {
				tx.delete(shift_pattern).run();
			}

			const customers = rows('customers');
			if (customers.length) {
				tx.insert(customer)
					.values(customers as (typeof customer.$inferInsert)[])
					.run();
			}
			const invoices = rows('invoices');
			if (invoices.length) {
				tx.insert(invoice)
					.values(
						invoices.map((inv) => ({
							...inv,
							invoice_date: new Date(inv.invoice_date as string),
							due_date: new Date(inv.due_date as string)
						})) as (typeof invoice.$inferInsert)[]
					)
					.run();
			}
			const incomeRows = rows('income');
			if (incomeRows.length) {
				tx.insert(income)
					.values(
						incomeRows.map((inc) => ({
							...inc,
							due_date: new Date(inc.due_date as string)
						})) as (typeof income.$inferInsert)[]
					)
					.run();
			}
			const settingRows = rows('settings');
			if (settingRows.length) {
				tx.insert(settings)
					.values(settingRows as (typeof settings.$inferInsert)[])
					.run();
			}
			const categories = rows('categories');
			if (categories.length) {
				tx.insert(category)
					.values(categories as (typeof category.$inferInsert)[])
					.run();
			}
			const expenses = rows('expenses');
			if (expenses.length) {
				tx.insert(expense)
					.values(expenses as (typeof expense.$inferInsert)[])
					.run();
			}
			const timesheets = rows('timesheets');
			if (timesheets.length) {
				tx.insert(timesheet)
					.values(timesheets as (typeof timesheet.$inferInsert)[])
					.run();
			}
			const patterns = rows('shift_patterns');
			if (patterns.length) {
				tx.insert(shift_pattern)
					.values(patterns as (typeof shift_pattern.$inferInsert)[])
					.run();
			}
		});

		return json({ success: true });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Import failed';
		return json({ error: `Import failed, nothing was changed: ${message}` }, { status: 500 });
	}
};
