import { command, form, query } from '$app/server';
import { db } from '$lib/server/db';
import { shift_pattern } from '$lib/server/db/schema';
import { eq, asc, max } from 'drizzle-orm';
import * as v from 'valibot';

export const get_shift_patterns = query(async () => {
	return await db.query.shift_pattern.findMany({
		orderBy: asc(shift_pattern.sort_order)
	});
});

export const create_shift_pattern = form(
	v.object({
		title: v.string(),
		start_time: v.string(),
		end_time: v.string(),
		color: v.string(),
		icon: v.optional(v.string())
	}),
	async ({ title, start_time, end_time, color, icon }) => {
		// Get max sort_order and add 1
		const [result] = await db
			.select({ maxOrder: max(shift_pattern.sort_order) })
			.from(shift_pattern);
		const sort_order = (result.maxOrder ?? -1) + 1;

		const [inserted] = await db
			.insert(shift_pattern)
			.values({ title, start_time, end_time, color, icon: icon || null, sort_order })
			.returning({ id: shift_pattern.id });

		get_shift_patterns().refresh();
		return { id: inserted.id };
	}
);

export const update_shift_pattern = command(
	v.object({
		id: v.string(),
		title: v.string(),
		start_time: v.string(),
		end_time: v.string(),
		color: v.string(),
		icon: v.optional(v.string())
	}),
	async ({ id, title, start_time, end_time, color, icon }) => {
		await db
			.update(shift_pattern)
			.set({ title, start_time, end_time, color, icon: icon || null })
			.where(eq(shift_pattern.id, id));
		get_shift_patterns().refresh();
	}
);

export const delete_shift_pattern = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		await db.delete(shift_pattern).where(eq(shift_pattern.id, id));
		get_shift_patterns().refresh();
	}
);

export const reorder_shift_patterns = command(
	v.object({
		ids: v.array(v.string())
	}),
	async ({ ids }) => {
		// Update sort_order for each id based on its array index
		for (let i = 0; i < ids.length; i++) {
			await db.update(shift_pattern).set({ sort_order: i }).where(eq(shift_pattern.id, ids[i]));
		}
		get_shift_patterns().refresh();
	}
);
