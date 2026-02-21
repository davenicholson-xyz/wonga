<script>
	import {
		get_shift_patterns,
		create_shift_pattern,
		update_shift_pattern,
		delete_shift_pattern,
		reorder_shift_patterns
	} from '$lib/funcs/shift_patterns.remote';

	const shiftsData = get_shift_patterns();
	const shifts = $derived(shiftsData.current ?? []);

	const COLOR_CLASSES = {
		primary: 'bg-primary',
		secondary: 'bg-secondary',
		success: 'bg-success',
		error: 'bg-error',
		warning: 'bg-warning',
		info: 'bg-info'
	};

	/** @type {HTMLDialogElement} */
	let editShiftModal;
	/** @type {HTMLDialogElement} */
	let deleteShiftModal;

	let editShiftId = $state('');
	let editShiftTitle = $state('');
	let editShiftStartTime = $state('');
	let editShiftEndTime = $state('');
	/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */
	let editShiftColor = $state('primary');
	let editShiftIcon = $state('');
	let editShiftSaving = $state(false);

	let deleteShiftId = $state('');
	let deleteShiftTitle = $state('');
	let deletingShift = $state(false);

	/** @type {string | null} */
	let draggedId = $state(null);

	/**
	 * @param {{id: string, title: string, start_time: string, end_time: string, color: string, icon: string | null}} s
	 */
	function openEditShift(s) {
		editShiftId = s.id;
		editShiftTitle = s.title;
		editShiftStartTime = s.start_time;
		editShiftEndTime = s.end_time;
		editShiftColor =
			/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (s.color);
		editShiftIcon = s.icon || '';
		editShiftSaving = false;
		editShiftModal.showModal();
	}

	async function saveEditShift() {
		editShiftSaving = true;
		await update_shift_pattern({
			id: editShiftId,
			title: editShiftTitle,
			start_time: editShiftStartTime,
			end_time: editShiftEndTime,
			color: editShiftColor,
			icon: editShiftIcon
		});
		editShiftSaving = false;
		editShiftModal.close();
	}

	/**
	 * @param {{id: string, title: string}} s
	 */
	function openDeleteShift(s) {
		deleteShiftId = s.id;
		deleteShiftTitle = s.title;
		deletingShift = false;
		deleteShiftModal.showModal();
	}

	async function confirmDeleteShift() {
		deletingShift = true;
		await delete_shift_pattern({ id: deleteShiftId });
		deletingShift = false;
		deleteShiftModal.close();
	}

	/**
	 * @param {DragEvent} e
	 * @param {string} id
	 */
	function handleDragStart(e, id) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	/**
	 * @param {DragEvent} e
	 * @param {string} targetId
	 */
	function handleDragOver(e, targetId) {
		e.preventDefault();
		if (!draggedId || draggedId === targetId) return;

		const draggedIndex = shifts.findIndex((s) => s.id === draggedId);
		const targetIndex = shifts.findIndex((s) => s.id === targetId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		// Optimistic reorder
		const newShifts = [...shifts];
		const [removed] = newShifts.splice(draggedIndex, 1);
		newShifts.splice(targetIndex, 0, removed);

		// Update the sort order on the server
		reorder_shift_patterns({ ids: newShifts.map((s) => s.id) });
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDrop(e) {
		e.preventDefault();
		draggedId = null;
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Existing Patterns List -->
	{#if shifts.length > 0}
		<div class="flex flex-col gap-2">
			{#each shifts as shift (shift.id)}
				<div
					role="listitem"
					class="rounded-xl border border-base-content/10 bg-base-100 p-3 cursor-move"
					draggable="true"
					ondragstart={(e) => handleDragStart(e, shift.id)}
					ondragover={(e) => handleDragOver(e, shift.id)}
					ondrop={handleDrop}
				>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center gap-3 min-w-0">
							<span class="text-base-content/40 cursor-grab">⠿</span>
							<div class="flex items-center gap-2 min-w-0">
								{#if shift.icon}
									<span class="text-lg">{shift.icon}</span>
								{/if}
								<h3 class="font-bold text-sm">{shift.title}</h3>
							</div>
							<span
								class="size-4 rounded-full shrink-0 {COLOR_CLASSES[
									/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
										shift.color
									)
								]}"
							></span>
							<span class="text-xs text-base-content/60">
								{shift.start_time} – {shift.end_time}
							</span>
						</div>
						<div class="flex gap-1 shrink-0">
							<button class="btn btn-ghost btn-xs" onclick={() => openEditShift(shift)}
								>Edit</button
							>
							<button
								class="btn btn-ghost btn-xs text-error"
								onclick={() => openDeleteShift(shift)}>Delete</button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Create New Pattern -->
	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-3">Create Shift Pattern</h2>
		<form {...create_shift_pattern}>
			<div class="flex flex-col gap-3">
				<div class="form-control">
					<label class="label" for="shift-title">
						<span class="label-text text-xs">Title</span>
					</label>
					<input
						id="shift-title"
						{...create_shift_pattern.fields.title.as('text')}
						class="input input-bordered input-sm w-full"
						placeholder="e.g. Night Shift"
					/>
				</div>

				<div class="flex gap-2">
					<div class="form-control flex-1">
						<label class="label" for="shift-start">
							<span class="label-text text-xs">Start Time</span>
						</label>
						<input
							id="shift-start"
							{...create_shift_pattern.fields.start_time.as('time')}
							class="input input-bordered input-sm w-full"
						/>
					</div>

					<div class="form-control flex-1">
						<label class="label" for="shift-end">
							<span class="label-text text-xs">End Time</span>
						</label>
						<input
							id="shift-end"
							{...create_shift_pattern.fields.end_time.as('time')}
							class="input input-bordered input-sm w-full"
						/>
					</div>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text text-xs">Colour</span>
					</label>
					<div class="flex gap-2">
						{#each ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as colorOption}
							<label class="cursor-pointer">
								<input
									{...create_shift_pattern.fields.color.as('radio', colorOption)}
									class="hidden peer"
								/>
								<span
									class="size-8 rounded-full block border-2 border-transparent peer-checked:border-base-content transition-all {COLOR_CLASSES[
										/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
											colorOption
										)
									]}"
								></span>
							</label>
						{/each}
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="shift-icon">
						<span class="label-text text-xs">Icon (optional emoji/character)</span>
					</label>
					<input
						id="shift-icon"
						{...create_shift_pattern.fields.icon.as('text')}
						class="input input-bordered input-sm w-20"
						maxlength="2"
						placeholder="🌃"
					/>
				</div>

				<button type="submit" class="btn btn-primary btn-sm">Create Pattern</button>
			</div>
		</form>
	</div>
</div>

<!-- Edit Shift Pattern Modal -->
<dialog bind:this={editShiftModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Shift Pattern</h3>
		<div class="form-control mt-4">
			<label class="label" for="edit-shift-title">
				<span class="label-text">Title</span>
			</label>
			<input
				id="edit-shift-title"
				type="text"
				class="input input-bordered input-sm w-full"
				bind:value={editShiftTitle}
			/>
		</div>
		<div class="flex gap-2 mt-2">
			<div class="form-control flex-1">
				<label class="label" for="edit-shift-start">
					<span class="label-text">Start Time</span>
				</label>
				<input
					id="edit-shift-start"
					type="time"
					class="input input-bordered input-sm w-full"
					bind:value={editShiftStartTime}
				/>
			</div>
			<div class="form-control flex-1">
				<label class="label" for="edit-shift-end">
					<span class="label-text">End Time</span>
				</label>
				<input
					id="edit-shift-end"
					type="time"
					class="input input-bordered input-sm w-full"
					bind:value={editShiftEndTime}
				/>
			</div>
		</div>
		<div class="form-control mt-2">
			<label class="label">
				<span class="label-text">Colour</span>
			</label>
			<div class="flex gap-2">
				{#each ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as colorOption}
					<label class="cursor-pointer">
						<input
							type="radio"
							name="edit-color"
							value={colorOption}
							bind:group={editShiftColor}
							class="hidden peer"
						/>
						<span
							class="size-8 rounded-full block border-2 border-transparent peer-checked:border-base-content transition-all {COLOR_CLASSES[
								/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
									colorOption
								)
							]}"
						></span>
					</label>
				{/each}
			</div>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-shift-icon">
				<span class="label-text">Icon (optional)</span>
			</label>
			<input
				id="edit-shift-icon"
				type="text"
				class="input input-bordered input-sm w-20"
				maxlength="2"
				bind:value={editShiftIcon}
			/>
		</div>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => editShiftModal.close()}
				>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={saveEditShift} disabled={editShiftSaving}>
				{editShiftSaving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Delete Shift Pattern Modal -->
<dialog bind:this={deleteShiftModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Delete Shift Pattern</h3>
		<p class="mt-4">Are you sure you want to delete <strong>{deleteShiftTitle}</strong>?</p>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => deleteShiftModal.close()}
				>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={confirmDeleteShift} disabled={deletingShift}>
				{deletingShift ? 'Deleting...' : 'Delete'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
