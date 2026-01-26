import { command, form, query } from '$app/server';
import { db } from '$lib/server/db';
import { category, expense } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { get } from 'svelte/store';
import * as v from 'valibot';

export const get_categories_with_expenses = query(async () => {
	const categories = await db.select().from(category);
	const expenses = await db.select().from(expense);

	const sorted = categories.map((category) => ({
		...category,
		expenses: expenses.filter((expense) => expense.category_id === category.id),
		total: expenses
			.filter((expense) => expense.category_id === category.id)
			.reduce((acc, expense) => acc + expense.amount, 0)
	}));

	const total = sorted.reduce(
		(acc, category) => acc + category.expenses.reduce((acc, expense) => acc + expense.amount, 0),
		0
	);

	return { categories: sorted, total };
});

export const create_category = form(
	v.object({
		name: v.string()
	}),
	async ({ name }) => {
		await db.insert(category).values({ name });
		get_categories_with_expenses().refresh();
	}
);

export const update_category = form(
	v.object({
		id: v.string(),
		name: v.string()
	}),
	async ({ id, name }) => {
		await db.update(category).set({ name }).where(eq(category.id, id));
		get_categories_with_expenses().refresh();
	}
);

export const delete_category = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		await db.delete(category).where(eq(category.id, id));
		get_categories_with_expenses().refresh();
	}
);
