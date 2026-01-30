<script lang="ts">
	import { edit_timesheet, delete_timesheet } from '$lib/funcs/timesheet.remote';

	type Entry = { id: string; date: string; location: string; start_time: string; end_time: string };

	let showModal = $state(false);

	let date = $state('');
	let location = $state('');
	let startTime = $state('06:00');
	let endTime = $state('16:00');
	let hasEntry = $state(false);

	export function show(d: string, entry?: Entry) {
		date = d;
		location = entry?.location ?? 'UPol';
		startTime = entry?.start_time ?? '06:00';
		endTime = entry?.end_time ?? '16:00';
		hasEntry = !!entry;
		showModal = true;
	}

	async function handleDelete() {
		await delete_timesheet({ date });
		showModal = false;
	}

	function setDayShift() {
		startTime = '06:00';
		endTime = '16:00';
	}

	function setBackShift() {
		startTime = '12:00';
		endTime = '22:00';
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<div>
			<h3>{new Date(date)}</h3>
		</div>
		<form {...edit_timesheet} onsubmit={() => (showModal = false)}>
			<input {...edit_timesheet.fields.date.as('text')} type="hidden" value={date} />

			<div class="form-control mt-4">
				<label class="label text-sm" for="location">
					<span class="label-text">Location</span>
				</label>
				<input
					id="location"
					class="input input-bordered input-sm"
					{...edit_timesheet.fields.location.as('text')}
					bind:value={location}
				/>
			</div>
			<div class="flex gap-2 mt-3">
				<button type="button" class="btn btn-outline btn-warning btn-sm grow" onclick={setDayShift}
					>Day Shift</button
				>
				<button type="button" class="btn btn-outline btn-info btn-sm grow" onclick={setBackShift}
					>Back Shift</button
				>
			</div>
			<div class="flex gap-3 mt-2">
				<div class="form-control grow">
					<label class="label" for="startTime">
						<span class="label-text text-sm">Start Time</span>
					</label>
					<input
						id="startTime"
						class="input input-bordered input-sm"
						{...edit_timesheet.fields.start_time.as('time')}
						bind:value={startTime}
					/>
				</div>
				<div class="form-control grow">
					<label class="label" for="endTime">
						<span class="label-text text-sm">End Time</span>
					</label>
					<input
						id="endTime"
						class="input input-bordered input-sm"
						{...edit_timesheet.fields.end_time.as('time')}
						bind:value={endTime}
					/>
				</div>
			</div>
			<div class="flex items-center gap-2 mt-3">
				<span class="text-sm text-base-content/60">Repeat for</span>
				<input
					id="repeatDays"
					{...edit_timesheet.fields.repeat.as('number')}
					class="input input-bordered input-sm w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					value="0"
					min="0"
				/>
				<span class="text-sm text-base-content/60">days</span>
			</div>
			<div class="modal-action">
				{#if hasEntry}
					<button type="button" class="btn btn-error btn-sm mr-auto" onclick={handleDelete}
						>Delete</button
					>
				{/if}
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					onclick={(e: Event) => {
						e.preventDefault();
						showModal = false;
					}}>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Update</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
