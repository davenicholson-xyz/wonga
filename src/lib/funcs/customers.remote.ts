import { command, form, query } from '$app/server';
import { db } from '$lib/server/db';
import { customer, invoice } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
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

export const update_customer = command(
	v.object({
		id: v.string(),
		name: v.string(),
		address: v.string(),
		email: v.string()
	}),
	async ({ id, name, address, email }) => {
		await db.update(customer).set({ name, address, email }).where(eq(customer.id, id));
	}
);

export const delete_customer = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		const [result] = await db
			.select({ count: count() })
			.from(invoice)
			.where(eq(invoice.customer_id, id));
		if (result.count > 0) {
			throw new Error(
				`Cannot delete this customer because they have ${result.count} invoice${result.count === 1 ? '' : 's'}`
			);
		}
		await db.delete(customer).where(eq(customer.id, id));
	}
);
