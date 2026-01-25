import { form, query, command } from '$app/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customer, invoice } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const mark_paid = command(v.string(), async (id) => {
	await db.update(invoice).set({ paid: 1 }).where(eq(invoice.id, id));
	get_invoices().refresh();
});

export const get_next_invoice_number = query(async () => {
	const lastInvoice = await db.query.invoice.findMany({
		orderBy: [desc(invoice.invoice_number)],
		limit: 1
	});
	return lastInvoice.length > 0 ? lastInvoice[0].invoice_number + 1 : 1;
});

export const get_invoices = query(async () => {
	return await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			customer_id: invoice.customer_id,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			customer_name: customer.name,
			paid: invoice.paid
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id));
});

export const create_invoice = form(
	v.object({
		invoice_number: v.number(),
		customer_id: v.string(),
		invoice_date: v.string(),
		due_date: v.string(),
		items: v.string(),
		total: v.number()
	}),
	async ({ invoice_number, customer_id, invoice_date, due_date, items, total }) => {
		await db.insert(invoice).values({
			invoice_number,
			customer_id,
			invoice_date: new Date(invoice_date),
			due_date: new Date(due_date),
			items,
			total
		});
		redirect(307, '/invoices');
	}
);
