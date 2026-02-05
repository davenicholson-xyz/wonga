<script lang="ts">
	import { page } from '$app/state';
	import { setTimeSheetModalControls } from '$lib/context/timesheet.svelte';

	import CalendarView from '$lib/components/timesheet/CalendarView.svelte';
	import TimesheetEntryModal from '$lib/components/timesheet/TimesheetEntryModal.svelte';
	import { resolve } from '$app/paths';
	import WeekViewModal from '$lib/components/timesheet/WeekViewModal.svelte';
	import { get_timesheet_for_month } from '$lib/funcs/timesheet.remote';
	import { formatCurrency } from '$lib/helpers';
	import { goto } from '$app/navigation';

	const HOURLY_RATE = 30;

	const year = $derived(page.params.year) as string;
	const month = $derived(page.params.month) as string;

	// Swipe handling
	let touchStartX = 0;
	let touchStartY = 0;
	let touchDeltaX = $state(0);
	let isSwiping = $state(false);
	let isAnimating = $state(false);
	const SWIPE_THRESHOLD = 60;

	function onTouchStart(e: TouchEvent) {
		if (isAnimating) return;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		touchDeltaX = 0;
		isSwiping = false;
	}

	function onTouchMove(e: TouchEvent) {
		if (isAnimating) return;
		const dx = e.touches[0].clientX - touchStartX;
		const dy = e.touches[0].clientY - touchStartY;

		// Only start horizontal swiping if horizontal movement dominates
		if (!isSwiping && Math.abs(dx) > 10) {
			if (Math.abs(dx) > Math.abs(dy) * 1.5) {
				isSwiping = true;
			} else {
				return;
			}
		}

		if (isSwiping) {
			e.preventDefault();
			touchDeltaX = dx;
		}
	}

	function onTouchEnd() {
		if (isAnimating || !isSwiping) {
			touchDeltaX = 0;
			isSwiping = false;
			return;
		}

		if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
			const direction = touchDeltaX > 0 ? 'right' : 'left';
			animateAndNavigate(direction);
		} else {
			// Snap back
			touchDeltaX = 0;
			isSwiping = false;
		}
	}

	function animateAndNavigate(direction: 'left' | 'right') {
		isAnimating = true;
		isSwiping = false; // enable transition so slide-out animates
		// Slide current month out
		touchDeltaX = direction === 'right' ? window.innerWidth : -window.innerWidth;

		const target =
			direction === 'right'
				? resolve(`/timesheet/${previous_year}/${previous_month}`)
				: resolve(`/timesheet/${next_year}/${next_month}`);

		// Wait for slide-out to finish (match the CSS transition duration)
		setTimeout(async () => {
			// Disable transition, jump new month to off-screen starting position
			// Swiping right (prev month): old exited right, new enters from LEFT
			// Swiping left (next month): old exited left, new enters from RIGHT
			isSwiping = true; // no transition for the jump
			touchDeltaX = direction === 'right' ? -window.innerWidth : window.innerWidth;

			await goto(target);

			// Force the browser to paint the off-screen position before animating
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					// Now enable transition and slide to center
					isSwiping = false;
					touchDeltaX = 0;
					setTimeout(() => {
						isAnimating = false;
					}, 300);
				});
			});
		}, 300);
	}

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
	const grossEarnings = $derived(totalHours * HOURLY_RATE);
	let showEarnings = $state(false);

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
	<button
		onclick={() => !isAnimating && animateAndNavigate('right')}
		aria-label="Previous Month"
		class="btn btn-ghost btn-sm btn-circle"
	>
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
	</button>

	<h3 class="text-2xl font-bold">{month_name} {year}</h3>

	<button
		onclick={() => !isAnimating && animateAndNavigate('left')}
		aria-label="Next Month"
		class="btn btn-ghost btn-sm btn-circle"
	>
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
	</button>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="overflow-hidden"
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
>
	<div
		class="will-change-transform"
		style="transform: translateX({touchDeltaX}px); transition: {isSwiping
			? 'none'
			: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};"
	>
		<CalendarView />
	</div>
</div>

<div class="grid grid-cols-2 gap-3 mx-4 mt-4">
	<div
		class="rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 p-3"
	>
		<div class="flex items-center gap-2 mb-1">
			<div class="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-warning"
				>
					<path
						fill-rule="evenodd"
						d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-[11px] font-medium text-base-content/50">Total Shifts</span>
		</div>
		<div class="text-2xl font-bold">{totalShifts}</div>
		<div class="text-[11px] text-base-content/40 mt-0.5">
			{weekdayShifts} weekday · {weekendShifts} weekend
		</div>
	</div>
	<div class="rounded-xl bg-gradient-to-br from-info/10 to-info/5 border border-info/20 p-3">
		<div class="flex items-center gap-2 mb-1">
			<div class="w-7 h-7 rounded-lg bg-info/20 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-info"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-[11px] font-medium text-base-content/50">Total Hours</span>
		</div>
		<div class="text-2xl font-bold">{totalHours.toFixed(1)}</div>
		<div class="text-[11px] text-base-content/40 mt-0.5">
			{avgHours.toFixed(1)} hrs avg per shift
		</div>
	</div>
</div>
<button
	class="w-[calc(100%-2rem)] mx-4 mt-3 text-left"
	onclick={() => (showEarnings = !showEarnings)}
>
	<div
		class="rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 p-3 transition-all {showEarnings
			? ''
			: 'opacity-80'}"
	>
		<div class="flex items-center gap-2 mb-1">
			<div class="w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-success"
				>
					<path
						d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603c-.348.07-.66.2-.918.39-.26.19-.462.44-.528.72a.67.67 0 0 0 .056.543Z"
					/>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.19 2.19 0 0 0-.736-.363V9.3c.514.1.98.27 1.388.492.582.315 1.012.754 1.232 1.292.22.539.199 1.1-.052 1.592-.249.49-.726.9-1.381 1.167-.213.087-.44.155-.677.203v.316a.75.75 0 0 1-1.5 0v-.316a3.78 3.78 0 0 1-1.653-.713 3.08 3.08 0 0 1-.925-1.2.75.75 0 0 1 1.395-.55c.12.303.292.508.447.563.225.08.469.135.736.363V8.7a5.38 5.38 0 0 1-1.388-.492C6.852 7.893 6.422 7.454 6.202 6.916a2.35 2.35 0 0 1 .052-1.592c.249-.49.726-.9 1.381-1.167.213-.087.44-.155.677-.203V4.75A.75.75 0 0 1 10 4Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<span class="text-[11px] font-medium text-base-content/50">Gross Earnings</span>
		</div>
		{#if showEarnings}
			<div class="text-2xl font-bold text-success">{formatCurrency(grossEarnings)}</div>
			<div class="text-[11px] text-base-content/40 mt-0.5">@ £{HOURLY_RATE}/hr</div>
		{:else}
			<div class="text-2xl font-bold text-base-content/20">* * * *</div>
			<div class="text-[11px] text-base-content/40 mt-0.5">Tap to reveal</div>
		{/if}
	</div>
</button>

<TimesheetEntryModal bind:this={timesheetEntryModal} />
<WeekViewModal bind:this={weekViewModal} />
