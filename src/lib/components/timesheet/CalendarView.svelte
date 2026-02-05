<script lang="ts">
	import { getTimeSheetModalControls } from '$lib/context/timesheet.svelte';

	import { page } from '$app/state';
	import { get_timesheet_for_month } from '$lib/funcs/timesheet.remote';
	import { SvelteDate } from 'svelte/reactivity';

	const year = $derived(parseInt(page.params.year as string));
	const month = $derived(parseInt(page.params.month as string));

	const tmonth = $derived(get_timesheet_for_month(`${year}-${month}-1`));
	const entries = $derived(tmonth.current ?? []);
	type Entry = (typeof entries)[number];

	const prevMonth = $derived(month === 1 ? 12 : month - 1);
	const prevYear = $derived(month === 1 ? year - 1 : year);
	const nextMonth = $derived(month === 12 ? 1 : month + 1);
	const nextYear = $derived(month === 12 ? year + 1 : year);

	const tprev = $derived(get_timesheet_for_month(`${prevYear}-${prevMonth}-1`));
	const tnext = $derived(get_timesheet_for_month(`${nextYear}-${nextMonth}-1`));
	const prevEntries = $derived(tprev.current ?? []);
	const nextEntries = $derived(tnext.current ?? []);

	const entryByDate = $derived(
		new Map([...entries, ...prevEntries, ...nextEntries].map((e) => [e.date, e]))
	);

	const days_in_month = $derived(new Date(year, month, 0).getDate());

	const first_day = $derived(new Date(year, month - 1, 1).getDay());
	const offset = $derived(first_day === 0 ? 6 : first_day - 1);

	type Cell = { day: number; current: boolean; date: string; entry?: Entry };
	type Week = { number: number; days: Cell[] };

	const prev_month_days = $derived(new Date(year, month - 1, 0).getDate());

	const cells = $derived.by(() => {
		const result: Cell[] = [];
		// Previous month padding
		for (let i = offset - 1; i >= 0; i--) {
			const d = prev_month_days - i;
			const date = `${prevYear}-${prevMonth}-${d}`;
			result.push({ day: d, current: false, date, entry: entryByDate.get(date) });
		}
		// Current month
		for (let d = 1; d <= days_in_month; d++) {
			const date = `${year}-${month}-${d}`;
			result.push({ day: d, current: true, date, entry: entryByDate.get(date) });
		}
		// Next month padding
		const remaining = 7 - (result.length % 7);
		if (remaining < 7) {
			for (let d = 1; d <= remaining; d++) {
				const date = `${nextYear}-${nextMonth}-${d}`;
				result.push({ day: d, current: false, date, entry: entryByDate.get(date) });
			}
		}
		return result;
	});

	const weeks = $derived.by(() => {
		const result: Week[] = [];
		for (let i = 0; i < cells.length; i += 7) {
			const days = cells.slice(i, i + 7);
			const first_current = days.find((d) => d.current);
			const ref_day = first_current ? first_current.day : 1;
			const date = new Date(year, month - 1, ref_day);
			const week_number = getISOWeekNumber(date);
			result.push({ number: week_number, days });
		}
		return result;
	});

	function getISOWeekNumber(date: Date): number {
		const d = new SvelteDate(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	function onWeekClick(week: Week) {
		const days = week.days.map((c) => {
			const [y, m, d] = c.date.split('-').map(Number);
			const dt = new Date(y, m - 1, d);
			return { date: c.date, dayOfWeek: dt.getDay(), entry: c.entry };
		});
		modals.weekView.show(days, week.number);
	}

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
	const currentWeek = getISOWeekNumber(today);

	const modals = getTimeSheetModalControls();
</script>

<div class="grid grid-cols-[2rem_repeat(7,1fr)] gap-x-1 gap-y-1 py-4">
	<div></div>
	{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as label, i (label)}
		<div
			class="text-center text-[10px] font-semibold uppercase tracking-wide pb-1 {i >= 5
				? 'text-base-content/30'
				: 'text-base-content/50'}"
		>
			{label}
		</div>
	{/each}

	{#each weeks as week (week.number)}
		<button
			class="flex items-center justify-center gap-0.5 h-11 text-[10px] font-semibold rounded-lg transition-colors bg-base-200/40 hover:bg-base-300 {week.number ===
			currentWeek
				? 'text-primary bg-primary/10 hover:bg-primary/20'
				: 'text-base-content/50'}"
			onclick={() => onWeekClick(week)}
		>
			{week.number}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="w-2.5 h-2.5 opacity-50"
			>
				<path
					fill-rule="evenodd"
					d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
		{#each week.days as cell, di (cell.date)}
			{@const isToday = cell.date === todayStr}
			<button
				class="btn btn-ghost text-sm flex flex-col items-center justify-center gap-0.5 h-11 min-w-0 p-0 rounded-lg
					{!cell.current ? 'opacity-20' : ''}
					{isToday ? 'ring-1 ring-primary/40 bg-primary/5' : ''}
					{di >= 5 && cell.current && !isToday ? 'bg-base-200/40' : ''}"
				onclick={() => {
					if (!cell.current) return;
					modals.newEntry.show(cell.date, entryByDate.get(cell.date));
				}}
			>
				<span class="leading-none {isToday ? 'text-primary font-bold' : ''}">{cell.day}</span>
				<span class="flex items-center justify-center w-4 h-4 shrink-0">
					{#if cell.entry?.unavailable}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							class="w-4 h-4 text-error/50"
						>
							<path
								d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
							/>
						</svg>
					{:else}
						<span
							class="w-1.5 h-1.5 rounded-full"
							class:bg-warning={cell.entry?.start_time === '06:00'}
							class:bg-info={cell.entry && cell.entry.start_time !== '06:00'}
							class:invisible={!cell.entry}
						></span>
					{/if}
				</span>
			</button>
		{/each}
	{/each}
</div>
