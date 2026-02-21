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

export const get_income_months = query(async () => {
	const invoices = await db.select({ due_date: invoice.due_date }).from(invoice);
	const seen = new Set<string>();
	const months: { month: number; year: number }[] = [];
	for (const inv of invoices) {
		const d = inv.due_date;
		const m = d.getMonth() + 1;
		const y = d.getFullYear();
		const key = `${y}-${m}`;
		if (!seen.has(key)) {
			seen.add(key);
			months.push({ month: m, year: y });
		}
	}
	return months.sort((a, b) => a.year - b.year || a.month - b.month);
});

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

		return { invoices, total: gross, net, tax_percent };
	}
);
