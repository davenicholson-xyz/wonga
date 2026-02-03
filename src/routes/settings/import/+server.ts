import { db } from '$lib/server/db';
import {
	customer,
	invoice,
	income,
	settings,
	category,
	expense,
	timesheet
} from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		if (!data.version || !data.exported_at) {
			return json({ error: 'Invalid backup file' }, { status: 400 });
		}

		// Clear all tables in correct order (foreign key dependencies)
		await db.delete(expense);
		await db.delete(category);
		await db.delete(income);
		await db.delete(invoice);
		await db.delete(customer);
		await db.delete(settings);
		await db.delete(timesheet);

		// Import in correct order
		if (data.customers?.length) {
			await db.insert(customer).values(data.customers);
		}
		if (data.invoices?.length) {
			await db.insert(invoice).values(
				data.invoices.map((inv: any) => ({
					...inv,
					invoice_date: new Date(inv.invoice_date),
					due_date: new Date(inv.due_date)
				}))
			);
		}
		if (data.income?.length) {
			await db.insert(income).values(
				data.income.map((inc: any) => ({
					...inc,
					due_date: new Date(inc.due_date)
				}))
			);
		}
		if (data.settings?.length) {
			await db.insert(settings).values(data.settings);
		}
		if (data.categories?.length) {
			await db.insert(category).values(data.categories);
		}
		if (data.expenses?.length) {
			await db.insert(expense).values(data.expenses);
		}
		if (data.timesheets?.length) {
			await db.insert(timesheet).values(data.timesheets);
		}

		return json({ success: true });
	} catch (e: any) {
		return json({ error: e?.message ?? 'Import failed' }, { status: 500 });
	}
};
