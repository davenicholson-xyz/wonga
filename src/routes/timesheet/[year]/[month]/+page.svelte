<script lang="ts">
	import { page } from '$app/state';
	import { setTimeSheetModalControls } from '$lib/context/timesheet.svelte';

	import CalendarView from '$lib/components/timesheet/CalendarView.svelte';
	import TimesheetEntryModal from '$lib/components/timesheet/TimesheetEntryModal.svelte';
	import { resolve } from '$app/paths';
	import WeekViewModal from '$lib/components/timesheet/WeekViewModal.svelte';
	import { get_timesheet_for_month } from '$lib/funcs/timesheet.remote';

	const year = $derived(page.params.year) as string;
	const month = $derived(page.params.month) as string;

	const tmonth = $derived(get_timesheet_for_month(`${parseInt(year)}-${parseInt(month)}-1`));
	const entries = $derived(tmonth.current ?? []);

	function parseHours(start: string, end: string): number {
		const [sh, sm] = start.split(':').map(Number);
		const [eh, em] = end.split(':').map(Number);
		return (eh * 60 + em - (sh * 60 + sm)) / 60;
	}

	const totalShifts = $derived(entries.length);
	const totalHours = $derived(
		entries.reduce((sum, e) => sum + parseHours(e.start_time, e.end_time), 0)
	);
	const avgHours = $derived(totalShifts > 0 ? totalHours / totalShifts : 0);

	const weekdayShifts = $derived(
		entries.filter((e) => {
			const d = new Date(e.date).getDay();
			return d !== 0 && d !== 6;
		}).length
	);
	const weekendShifts = $derived(totalShifts - weekdayShifts);

	const month_name = $derived(
		new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-GB', {
			month: 'long'
		})
	);

	const current_month_year = $derived({ month: parseInt(month), year: parseInt(year) });

	const next_month = $derived(current_month_year.month === 12 ? 1 : current_month_year.month + 1);
	const next_year = $derived(
		current_month_year.month === 12 ? current_month_year.year + 1 : current_month_year.year
	);

	const previous_month = $derived(
		current_month_year.month === 1 ? 12 : current_month_year.month - 1
	);
	const previous_year = $derived(
		current_month_year.month === 1 ? current_month_year.year - 1 : current_month_year.year
	);

	let timesheetEntryModal: ReturnType<typeof TimesheetEntryModal>;
	let weekViewModal: ReturnType<typeof WeekViewModal>;

	setTimeSheetModalControls({
		newEntry: {
			show: (date, entry) => {
				timesheetEntryModal.show(date, entry);
			}
		},
		weekView: {
			show: (days, weekNumber) => {
				weekViewModal.show(days, weekNumber);
			}
		}
	});
</script>

<div class="flex justify-between align-center mb-8 mx-6">
	<a href={resolve(`/timesheet/${previous_year}/${previous_month}`)} aria-label="Previous Month">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
		</svg>
	</a>

	<h3 class="text-2xl font-bold">{month_name} {year}</h3>

	<a href={resolve(`/timesheet/${next_year}/${next_month}`)} aria-label="Next Month">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
		</svg>
	</a>
</div>

<CalendarView />

{#if totalShifts > 0}
	<div class="grid grid-cols-2 gap-3 mx-4 mt-4">
		<div class="stat bg-base-100 rounded-box shadow-sm p-3">
			<div class="stat-title text-[11px]">Total Shifts</div>
			<div class="stat-value text-lg">{totalShifts}</div>
			<div class="stat-desc text-[11px]">{weekdayShifts} weekday · {weekendShifts} weekend</div>
		</div>
		<div class="stat bg-base-100 rounded-box shadow-sm p-3">
			<div class="stat-title text-[11px]">Total Hours</div>
			<div class="stat-value text-lg">{totalHours.toFixed(1)}</div>
			<div class="stat-desc text-[11px]">{avgHours.toFixed(1)} hrs avg per shift</div>
		</div>
	</div>
{/if}

<TimesheetEntryModal bind:this={timesheetEntryModal} />
<WeekViewModal bind:this={weekViewModal} />
