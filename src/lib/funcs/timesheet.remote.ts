import { command, form, query } from '$app/server';
import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { timesheet } from '$lib/server/db/schema';
import * as v from 'valibot';

function monthRangeFromDate(date: string) {
	const [yearStr, monthStr] = date.split('-');
	const year = Number(yearStr);
	const month = Number(monthStr);

	const start = `${yearStr}-${monthStr}-1`;

	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;

	const end = `${nextYear}-${String(nextMonth)}-1`;

	return { start, end };
}

export const get_timesheet_for_month = query(v.string(), async (date) => {
	const { start, end } = monthRangeFromDate(date);
	const timesheets = await db
		.select()
		.from(timesheet)
		.where(and(gte(timesheet.date, start), lt(timesheet.date, end)));

	return timesheets;
});

export const edit_timesheet = form(
	v.object({
		date: v.string(),
		location: v.string(),
		start_time: v.string(),
		end_time: v.string(),
		repeat: v.optional(v.number(), 0)
	}),
	async ({ date, location, start_time, end_time, repeat }) => {
		await db
			.insert(timesheet)
			.values({ date, location, start_time, end_time })
			.onConflictDoUpdate({ target: timesheet.date, set: { location, start_time, end_time } });

		console.log(date);

		const [y, m] = date.split('-');
		get_timesheet_for_month(`${y}-${m}-1`).refresh();
	}
);

export const delete_timesheet = command(
	v.object({
		date: v.string()
	}),
	async ({ date }) => {
		await db.delete(timesheet).where(eq(timesheet.date, date));

		const [y, m] = date.split('-');
		get_timesheet_for_month(`${y}-${m}-1`).refresh();
	}
);
