import { db } from '$lib/server/db';
import { customer, invoice, income, settings, category, expense, timesheet } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
	const data = {
		version: 1,
		exported_at: new Date().toISOString(),
		customers: await db.select().from(customer),
		invoices: await db.select().from(invoice),
		income: await db.select().from(income),
		settings: await db.select().from(settings),
		categories: await db.select().from(category),
		expenses: await db.select().from(expense),
		timesheets: await db.select().from(timesheet)
	};

	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="wonga-backup-${new Date().toISOString().split('T')[0]}.json"`
		}
	});
}
