<script lang="ts">
	let showModal = $state(false);

	let startTime = $state('06:00');
	let endTime = $state('16:00');

	export function show() {
		showModal = true;
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
			<h3>Selected date here</h3>
		</div>
		<form onsubmit={() => (showModal = false)}>
			<div class="form-control mt-4">
				<label class="label text-sm" for="location">
					<span class="label-text">Location</span>
				</label>
				<!-- auto complete with UPol -->
				<input id="location" class="input input-bordered input-sm" value="UPol" />
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
						type="time"
						class="input input-bordered input-sm"
						bind:value={startTime}
					/>
				</div>
				<div class="form-control grow">
					<label class="label" for="endTime">
						<span class="label-text text-sm">End Time</span>
					</label>
					<input
						id="endTime"
						type="time"
						class="input input-bordered input-sm"
						bind:value={endTime}
					/>
				</div>
			</div>
			<div class="flex items-center gap-2 mt-3">
				<span class="text-sm text-base-content/60">Repeat for</span>
				<input
					id="repeatDays"
					type="number"
					class="input input-bordered input-sm w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					value="1"
					min="1"
				/>
				<span class="text-sm text-base-content/60">days</span>
			</div>
			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost btn-sm"
					onclick={(e: Event) => {
						e.preventDefault();
						showModal = false;
					}}>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
