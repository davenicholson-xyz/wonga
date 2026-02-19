<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Entry } from '$lib/context/timesheet.svelte';

	type Day = { date: string; dayOfWeek: number; entry?: Entry };

	let showModal = $state(false);
	let days = $state<Day[]>([]);
	let weekNumber = $state(0);

	const weekdays = $derived(
		days.filter((d) => d.entry && !d.entry.unavailable && d.dayOfWeek >= 1 && d.dayOfWeek <= 5)
	);
	const weekends = $derived(
		days.filter((d) => d.entry && !d.entry.unavailable && (d.dayOfWeek === 0 || d.dayOfWeek === 6))
	);
	const allWithEntries = $derived(days.filter((d) => d.entry && !d.entry.unavailable));
	const weekTotalHours = $derived(totalHours(allWithEntries));

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function formatDate(date: string) {
		const [y, m, d] = date.split('-');
		return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
	}

	function entryHours(entry: Entry) {
		const [sh, sm] = entry.start_time.split(':').map(Number);
		const [eh, em] = entry.end_time.split(':').map(Number);
		const startHours = sh + sm / 60;
		const endHours = eh + em / 60;

		// If end time is before start time, shift crosses midnight
		const duration = endHours < startHours ? 24 + endHours - startHours : endHours - startHours;

		// Cap at 24 hours maximum
		return Math.min(duration, 24);
	}

	function totalHours(entries: Day[]) {
		return entries.reduce((sum, d) => {
			if (!d.entry) return sum;
			return sum + entryHours(d.entry);
		}, 0);
	}

	function generateInvoice() {
		const items: { name: string; description: string; quantity: number }[] = [];

		if (weekdays.length > 0) {
			const hours = totalHours(weekdays);
			const location = weekdays[0].entry?.location ?? '';
			items.push({ name: location, description: 'Weekdays', quantity: hours });
		}

		if (weekends.length > 0) {
			const hours = totalHours(weekends);
			const location = weekends[0].entry?.location ?? '';
			items.push({ name: location, description: 'Weekend', quantity: hours });
		}

		const url = new URL(resolve('/invoices/new'), window.location.origin);
		url.searchParams.set('items', JSON.stringify(items));
		showModal = false;
		window.location.href = url.toString();
	}

	export function show(weekDays: Day[], week: number) {
		days = weekDays;
		weekNumber = week;
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box p-0 overflow-hidden">
		<!-- Header -->
		<div class="bg-gradient-to-br from-primary/15 to-primary/5 px-5 py-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs font-medium text-base-content/50 uppercase tracking-wide">Week</p>
					<h3 class="text-2xl font-bold">{weekNumber}</h3>
				</div>
				{#if allWithEntries.length > 0}
					<div class="text-right">
						<p class="text-xs font-medium text-base-content/50 uppercase tracking-wide">Total</p>
						<p class="text-2xl font-bold text-primary">
							{weekTotalHours.toFixed(1)}
							<span class="text-sm font-medium text-base-content/50">hrs</span>
						</p>
					</div>
				{/if}
			</div>
			{#if allWithEntries.length > 0}
				<div class="flex items-center gap-2 mt-2 text-xs text-base-content/40">
					<span>{allWithEntries.length} shift{allWithEntries.length !== 1 ? 's' : ''}</span>
					<span>·</span>
					<span>{weekdays.length} weekday{weekdays.length !== 1 ? 's' : ''}</span>
					{#if weekends.length > 0}
						<span>·</span>
						<span>{weekends.length} weekend</span>
					{/if}
				</div>
			{/if}
		</div>

		<div class="px-5 py-4">
			<!-- Shift list -->
			{#if allWithEntries.length > 0}
				<div class="divide-y divide-base-200">
					{#each allWithEntries as day (day.date)}
						{@const hours = entryHours(day.entry!)}
						{@const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6}
						<div class="flex items-center gap-2 py-1.5 text-xs">
							<span class="w-7 font-semibold {isWeekend ? 'text-info' : 'text-base-content/40'}"
								>{dayNames[day.dayOfWeek]}</span
							>
							<span class="text-base-content/50">{formatDate(day.date)}</span>
							<span class="flex-1 truncate font-medium">{day.entry?.location}</span>
							<span class="text-base-content/50">{day.entry?.start_time}-{day.entry?.end_time}</span
							>
							<span class="w-10 text-right font-bold">{hours.toFixed(1)}h</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-base-content/40 text-center py-6">No shifts this week</p>
			{/if}

			<!-- Generate Invoice button -->
			{#if allWithEntries.length > 0}
				<button type="button" class="btn btn-primary btn-sm w-full mt-5" onclick={generateInvoice}>
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
			{/if}

			<div class="mt-4 flex justify-end">
				<button type="button" class="btn btn-ghost btn-sm" onclick={() => (showModal = false)}
					>Close</button
				>
			</div>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
