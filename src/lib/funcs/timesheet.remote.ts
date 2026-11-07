import { command, form, query } from '$app/server';
import { eq, like } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { timesheet } from '$lib/server/db/schema';
import * as v from 'valibot';

// Timesheet dates are stored unpadded ("YYYY-M-D"), so a text range like
// '2026-1-1'..'2026-2-1' would also match '2026-10-5'. Match the month prefix instead.
function monthPatternFromDate(date: string) {
	const [yearStr, monthStr] = date.split('-');
	return `${Number(yearStr)}-${Number(monthStr)}-%`;
}

export const get_timesheet_for_month = query(v.string(), async (date) => {
	return await db
		.select()
		.from(timesheet)
		.where(like(timesheet.date, monthPatternFromDate(date)));
});

export const edit_timesheet = form(
	v.object({
		date: v.string(),
		location: v.string(),
		start_time: v.string(),
		end_time: v.string(),
		repeat: v.optional(v.number(), 0),
		unavailable: v.optional(v.string(), 'false')
	}),
	async ({ date, location, start_time, end_time, repeat, unavailable: unavailableStr }) => {
		const unavailable = unavailableStr === 'true';
		await db
			.insert(timesheet)
			.values({ date, location, start_time, end_time, unavailable })
			.onConflictDoUpdate({
				target: timesheet.date,
				set: { location, start_time, end_time, unavailable }
			});

		if (repeat > 1) {
			const baseDate = new Date(date);
			const monthsToRefresh = new Set<string>();

			for (let i = 1; i < repeat; i++) {
				const nextDate = new Date(baseDate);
				nextDate.setDate(nextDate.getDate() + i);
				const y = nextDate.getFullYear();
				const m = String(nextDate.getMonth() + 1);
				const d = String(nextDate.getDate());
				const dateStr = `${y}-${m}-${d}`;

				await db
					.insert(timesheet)
					.values({ date: dateStr, location, start_time, end_time, unavailable })
					.onConflictDoUpdate({
						target: timesheet.date,
						set: { location, start_time, end_time, unavailable }
					});

				monthsToRefresh.add(`${y}-${m}-1`);
			}

			for (const monthDate of monthsToRefresh) {
				get_timesheet_for_month(monthDate).refresh();
			}
		}

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
