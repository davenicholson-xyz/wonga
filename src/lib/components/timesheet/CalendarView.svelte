<script lang="ts">
	import { getTimeSheetModalControls } from '$lib/context/timesheet.svelte';
	import { page } from '$app/state';

	const year = $derived(parseInt(page.params.year as string));
	const month = $derived(parseInt(page.params.month as string));

	const days_in_month = $derived(new Date(year, month, 0).getDate());

	const first_day = $derived(new Date(year, month - 1, 1).getDay());
	const offset = $derived(first_day === 0 ? 6 : first_day - 1);

	type Cell = { day: number; current: boolean };
	type Week = { number: number; days: Cell[] };

	const prev_month_days = $derived(new Date(year, month - 1, 0).getDate());

	const cells = $derived.by(() => {
		const result: Cell[] = [];
		// Previous month padding
		for (let i = offset - 1; i >= 0; i--) {
			result.push({ day: prev_month_days - i, current: false });
		}
		// Current month
		for (let d = 1; d <= days_in_month; d++) {
			result.push({ day: d, current: true });
		}
		// Next month padding
		const remaining = 7 - (result.length % 7);
		if (remaining < 7) {
			for (let d = 1; d <= remaining; d++) {
				result.push({ day: d, current: false });
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
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	function onWeekClick(week: Week) {
		console.log('Week clicked:', week.number);
	}

	const modals = getTimeSheetModalControls();
</script>

<div class="grid grid-cols-[auto_repeat(7,1fr)] gap-x-1 gap-y-2 items-center">
	<div></div>
	{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as label}
		<div class="text-center text-xs font-bold text-base-content/60 pb-1">{label}</div>
	{/each}

	{#each weeks as week}
		<button
			class="btn btn-ghost btn-xs text-xs text-base-content/40 w-8"
			onclick={() => onWeekClick(week)}
		>
			{week.number}
		</button>
		{#each week.days as cell}
			<button
				class="btn btn-sm btn-ghost aspect-square text-sm"
				class:opacity-20={!cell.current}
				onclick={() => cell.current && modals.newCategory.show()}
			>
				{cell.day}
			</button>
		{/each}
	{/each}
</div>
