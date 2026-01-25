import { form, query } from '$app/server';
import { db } from '$lib/server/db';
import { customer } from '$lib/server/db/schema';
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
