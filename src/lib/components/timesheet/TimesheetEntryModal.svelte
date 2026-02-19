<script lang="ts">
	import { edit_timesheet, delete_timesheet } from '$lib/funcs/timesheet.remote';
	import { get_shift_patterns } from '$lib/funcs/shift_patterns.remote';

	type Entry = {
		id: string;
		date: string;
		location: string;
		start_time: string;
		end_time: string;
		unavailable: boolean | null;
	};

	const BTN_COLOR_CLASSES = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		success: 'btn-success',
		error: 'btn-error',
		warning: 'btn-warning',
		info: 'btn-info'
	};

	const shiftsData = get_shift_patterns();
	const patterns = $derived(shiftsData.current ?? []);

	let showModal = $state(false);

	let date = $state('');
	let location = $state('');
	let startTime = $state('06:00');
	let endTime = $state('16:00');
	let hasEntry = $state(false);
	let unavailable = $state(false);

	export function show(d: string, entry?: Entry) {
		date = d;
		location = entry?.location ?? 'UPol';
		startTime = entry?.start_time ?? '06:00';
		endTime = entry?.end_time ?? '16:00';
		unavailable = entry?.unavailable ?? false;
		hasEntry = !!entry;
		showModal = true;
	}

	async function handleDelete() {
		await delete_timesheet({ date });
		showModal = false;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<div>
			<h3>
				{new Date(date).toLocaleDateString('en-GB', {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})}
			</h3>
		</div>
		<form {...edit_timesheet} onsubmit={() => (showModal = false)}>
			<input {...edit_timesheet.fields.date.as('text')} type="hidden" value={date} />
			<input
				{...edit_timesheet.fields.unavailable.as('text')}
				type="hidden"
				value={unavailable ? 'true' : 'false'}
			/>

			<label class="fieldset-label flex items-center justify-between mt-4 cursor-pointer">
				<span class="text-sm font-medium">Unavailable</span>
				<input type="checkbox" class="toggle toggle-sm toggle-error" bind:checked={unavailable} />
			</label>

			{#if unavailable}
				<input {...edit_timesheet.fields.location.as('text')} type="hidden" value="" />
				<input {...edit_timesheet.fields.start_time.as('text')} type="hidden" value="00:00" />
				<input {...edit_timesheet.fields.end_time.as('text')} type="hidden" value="00:00" />
			{/if}

			{#if !unavailable}
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
				{#if patterns.length > 0}
					<div class="flex flex-wrap gap-2 mt-3">
						{#each patterns as p (p.id)}
							{@const colorClass =
								BTN_COLOR_CLASSES[
									p.color as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
								] ?? 'btn-primary'}
							<button
								type="button"
								class="btn btn-outline btn-sm grow {colorClass}"
								onclick={() => {
									startTime = p.start_time;
									endTime = p.end_time;
								}}
							>
								{#if p.icon}<span>{p.icon}</span>{/if}
								<span class="truncate max-w-24">{p.title}</span>
							</button>
						{/each}
					</div>
				{/if}
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
			{/if}
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
