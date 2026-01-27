import { query } from '$app/server';
import { db } from '$lib/server/db';
import { invoice } from '$lib/server/db/schema';
import { lte, gte, and } from 'drizzle-orm';
import * as v from 'valibot';
import { get_settings } from './settings.remote';

export const get_invoice = query(async () => {
	return await db.query.income.findMany();
});

export const get_invoice_for_month = query(
	v.object({ month: v.number(), year: v.number() }),
	async ({ month, year }) => {
		const startOfMonth = new Date(year, month - 1, 1);
		const endOfMonth = new Date(year, month, 0);

		return await db
			.select()
			.from(invoice)
			.where(and(gte(invoice.due_date, startOfMonth), lte(invoice.due_date, endOfMonth)));
	}
);

export const get_income_for = query(
	v.object({ month: v.number(), year: v.number() }),
	async ({ month, year }) => {
		const startOfMonth = new Date(year, month - 1, 1);
		const endOfMonth = new Date(year, month, 0);

		const invoices = await db
			.select()
			.from(invoice)
			.where(and(gte(invoice.due_date, startOfMonth), lte(invoice.due_date, endOfMonth)));

		const gross = invoices.reduce((acc, invoice) => acc + invoice.total, 0);

		const key = `tax_percent_${year}_${month}`;
		let tax_percent = 20;
		await get_settings({ key }).then((saved) => {
			tax_percent = parseInt(saved?.value) || 20;
		});
		const net = gross - (gross * tax_percent) / 100;

		return { invoices, total: gross, net };
	}
);
