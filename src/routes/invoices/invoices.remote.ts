import { form, query } from '$app/server';
import { db } from '$lib/server/db';
import { customer, invoice } from '$lib/server/db/schema';
import * as v from 'valibot';

export const get_customers = query(async () => {
	return await db.query.customer.findMany();
});

export const create_customer = form(
	v.object({
		name: v.string(),
		address: v.string(),
		email: v.string()
	}),
	async ({ name, address, email }) => {
		const [result] = await db
			.insert(customer)
			.values({ name, address, email })
			.returning({ id: customer.id });
		return { id: result.id };
	}
);

export const create_invoice = form(
	v.object({
		customer_id: v.string(),
		invoice_date: v.string(),
		due_date: v.string()
	}),
	async ({ customer_id, invoice_date, due_date }) => {
		const [result] = await db
			.insert(invoice)
			.values({ customer_id, invoice_date: new Date(invoice_date), due_date: new Date(due_date) })
			.returning({ id: invoice.id });
		return { id: result.id };
	}
);
