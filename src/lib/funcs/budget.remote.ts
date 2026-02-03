import { command, form, query } from '$app/server';
import { db } from '$lib/server/db';
import { category, expense } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

export const get_categories_with_expenses = query(async () => {
	const categories = await db.select().from(category);
	const expenses = await db.select().from(expense);

	const sorted = categories
		.map((category) => {
			const categoryExpenses = expenses
				.filter((expense) => expense.category_id === category.id)
				.sort((a, b) => b.amount - a.amount);
			return {
				...category,
				expenses: categoryExpenses,
				total: categoryExpenses.reduce((acc, expense) => acc + expense.amount, 0)
			};
		})
		.sort((a, b) => b.total - a.total);

	const total = sorted.reduce(
		(acc, category) => acc + category.expenses.reduce((acc, expense) => acc + expense.amount, 0),
		0
	);

	return { categories: sorted, total };
});

export const create_category = form(
	v.object({
		name: v.string(),
		emoji: v.optional(v.string())
	}),
	async ({ name, emoji }) => {
		await db.insert(category).values({ name, emoji: emoji || null });
		get_categories_with_expenses().refresh();
	}
);

export const update_category = form(
	v.object({
		id: v.string(),
		name: v.string(),
		emoji: v.optional(v.string())
	}),
	async ({ id, name, emoji }) => {
		await db
			.update(category)
			.set({ name, emoji: emoji || null })
			.where(eq(category.id, id));
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

export const create_expense = form(
	v.object({
		category_id: v.string(),
		description: v.string(),
		amount: v.number(),
		billspot: v.optional(v.boolean(), false)
	}),
	async ({ category_id, description, amount, billspot }) => {
		await db.insert(expense).values({ category_id, description, amount, billspot });
		get_categories_with_expenses().refresh();
	}
);

export const update_expense = form(
	v.object({
		id: v.string(),
		description: v.string(),
		amount: v.number(),
		billspot: v.optional(v.boolean(), false)
	}),
	async ({ id, description, amount, billspot }) => {
		await db
			.update(expense)
			.set({
				description,
				amount,
				billspot
			})
			.where(eq(expense.id, id));
		get_categories_with_expenses().refresh();
	}
);

export const delete_expense = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		await db.delete(expense).where(eq(expense.id, id));
		get_categories_with_expenses().refresh();
	}
);
