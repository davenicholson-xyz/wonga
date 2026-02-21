import { form, query, command } from '$app/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customer, invoice } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { sendInvoiceEmail } from '$lib/server/send-invoice';
import * as v from 'valibot';

export const get_invoice = query(v.number(), async (invoice_number) => {
	const results = await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			paid: invoice.paid,
			emailed: invoice.emailed,
			auto_send: invoice.auto_send,
			timesheet_image: invoice.timesheet_image,
			customer_id: invoice.customer_id,
			customer_name: customer.name,
			customer_email: customer.email,
			customer_address: customer.address
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.where(eq(invoice.invoice_number, invoice_number));
	return results[0] ?? null;
});

export const mark_paid = command(v.string(), async (id) => {
	const [{ invoice_number }] = await db
		.update(invoice)
		.set({ paid: 1 })
		.where(eq(invoice.id, id))
		.returning({ invoice_number: invoice.invoice_number });

	get_invoice(invoice_number).refresh();
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
			paid: invoice.paid,
			emailed: invoice.emailed,
			auto_send: invoice.auto_send,
			timesheet_image: invoice.timesheet_image
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.orderBy(desc(invoice.invoice_number));
});

export const send_invoice = command(v.number(), async (invoice_number) => {
	await sendInvoiceEmail(invoice_number);
	get_invoice(invoice_number).refresh();
	get_invoices().refresh();
});

export const toggle_auto_send = command(
	v.object({ id: v.string(), invoice_number: v.number(), auto_send: v.number() }),
	async ({ id, invoice_number, auto_send }) => {
		await db
			.update(invoice)
			.set({ auto_send: auto_send ? 0 : 1 })
			.where(eq(invoice.id, id));
		get_invoice(invoice_number).refresh();
		get_invoices().refresh();
	}
);

export const update_invoice = command(
	v.object({
		id: v.string(),
		invoice_number: v.number(),
		customer_id: v.string(),
		invoice_date: v.string(),
		due_date: v.string(),
		items: v.string(),
		total: v.number()
	}),
	async ({ id, invoice_number, customer_id, invoice_date, due_date, items, total }) => {
		await db
			.update(invoice)
			.set({
				customer_id,
				invoice_date: new Date(invoice_date),
				due_date: new Date(due_date),
				items,
				total
			})
			.where(eq(invoice.id, id));

		get_invoice(invoice_number).refresh();
		get_invoices().refresh();
	}
);

export const delete_invoice = command(
	v.object({ id: v.string(), invoice_number: v.number() }),
	async ({ id, invoice_number }) => {
		await db.delete(invoice).where(eq(invoice.id, id));
		get_invoice(invoice_number).refresh();
		get_invoices().refresh();
	}
);

export const create_invoice = form(
	v.object({
		invoice_number: v.number(),
		customer_id: v.string(),
		invoice_date: v.string(),
		due_date: v.string(),
		items: v.string(),
		total: v.number(),
		auto_send: v.optional(v.number(), 0)
	}),
	async ({ invoice_number, customer_id, invoice_date, due_date, items, total, auto_send }) => {
		await db.insert(invoice).values({
			invoice_number,
			customer_id,
			invoice_date: new Date(invoice_date),
			due_date: new Date(due_date),
			items,
			total,
			auto_send: auto_send ?? 0
		});
		redirect(307, `/invoices/${invoice_number}`);
	}
);
