<script lang="ts">
	import type { Entry } from '$lib/context/timesheet.svelte';

	type Day = { date: string; dayOfWeek: number; entry?: Entry };

	let showModal = $state(false);
	let days = $state<Day[]>([]);
	let weekNumber = $state(0);

	const weekdays = $derived(days.filter((d) => d.entry && d.dayOfWeek >= 1 && d.dayOfWeek <= 5));
	const weekends = $derived(
		days.filter((d) => d.entry && (d.dayOfWeek === 0 || d.dayOfWeek === 6))
	);

	function formatDate(date: string) {
		const [y, m, d] = date.split('-');
		return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
	}

	export function show(weekDays: Day[], week: number) {
		days = weekDays;
		weekNumber = week;
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Week {weekNumber}</h3>

		{#if weekdays.length > 0}
			<h4 class="font-semibold text-sm text-base-content/60 mb-2">Weekdays</h4>
			<div class="overflow-x-auto mb-4">
				<table class="table table-xs text-xs">
					<!-- <thead>
						<tr>
							<th>Date</th>
							<th>Location</th>
							<th>Start</th>
							<th>End</th>
						</tr>
					</thead> -->
					<tbody>
						{#each weekdays as day (day.date)}
							<tr>
								<td>{formatDate(day.date)}</td>
								<td>{day.entry?.location}</td>
								<td>{day.entry?.start_time}</td>
								<td>{day.entry?.end_time}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if weekends.length > 0}
			<h4 class="font-semibold text-sm text-base-content/60 mb-2">Weekend</h4>
			<div class="overflow-x-auto">
				<table class="table table-xs text-xs">
					<!-- <thead>
						<tr>
							<th>Date</th>
							<th>Location</th>
							<th>Start</th>
							<th>End</th>
						</tr>
					</thead> -->
					<tbody>
						{#each weekends as day (day.date)}
							<tr>
								<td>{formatDate(day.date)}</td>
								<td>{day.entry?.location}</td>
								<td>{day.entry?.start_time}</td>
								<td>{day.entry?.end_time}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<button type="button" class="btn btn-primary btn-sm w-full mt-8">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-4 h-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
				/>
			</svg>
			Generate Invoice
		</button>

		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => (showModal = false)}
				>Close</button
			>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
