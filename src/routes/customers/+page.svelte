<script>
	import { get_customers, update_customer, delete_customer } from '$lib/funcs/customers.remote';

	const customersData = get_customers();
	const customers = $derived(customersData.current ?? []);

	/** @type {HTMLDialogElement} */
	let editModal;
	/** @type {HTMLDialogElement} */
	let deleteModal;
	let editId = $state('');
	let editName = $state('');
	let editAddress = $state('');
	let editEmail = $state('');
	let editSaving = $state(false);

	let deleteId = $state('');
	let deleteName = $state('');
	let deleteError = $state('');
	let deleting = $state(false);

	/** @param {{id: string, name: string, address: string, email: string}} c */
	function openEdit(c) {
		editId = c.id;
		editName = c.name;
		editAddress = c.address;
		editEmail = c.email;
		editSaving = false;
		editModal.showModal();
	}

	async function saveEdit() {
		editSaving = true;
		await update_customer({ id: editId, name: editName, address: editAddress, email: editEmail });
		customersData.refresh();
		editSaving = false;
		editModal.close();
	}

	/** @param {{id: string, name: string}} c */
	function openDelete(c) {
		deleteId = c.id;
		deleteName = c.name;
		deleteError = '';
		deleting = false;
		deleteModal.showModal();
	}

	async function confirmDelete() {
		deleting = true;
		deleteError = '';
		try {
			await delete_customer({ id: deleteId });
			customersData.refresh();
			deleteModal.close();
		} catch (/** @type {any} */ e) {
			deleteError = e?.message ?? 'Failed to delete customer';
		}
		deleting = false;
	}
</script>

<h1 class="text-2xl font-bold mb-4">Customers</h1>

<div class="flex flex-col gap-2">
	{#if customers.length === 0}
		<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
			<p class="text-sm text-base-content/40">No customers yet.</p>
		</div>
	{:else}
		{#each customers as c (c.id)}
			<div class="rounded-xl border border-base-content/10 bg-base-100 p-3">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<h3 class="font-bold text-xs">{c.name}</h3>
						<p class="text-[11px] text-base-content/50 mt-0.5">{c.email}</p>
						{#if c.address}
							<p class="text-[11px] text-base-content/40 whitespace-pre-line mt-1">{c.address}</p>
						{/if}
					</div>
					<div class="flex gap-1 shrink-0">
						<button class="btn btn-ghost btn-xs" onclick={() => openEdit(c)}>Edit</button>
						<button class="btn btn-ghost btn-xs text-error" onclick={() => openDelete(c)}
							>Delete</button
						>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>

<!-- Edit Customer Modal -->
<dialog bind:this={editModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Customer</h3>
		<div class="form-control mt-4">
			<label class="label" for="edit-name">
				<span class="label-text">Name</span>
			</label>
			<input
				id="edit-name"
				type="text"
				class="input input-bordered input-sm w-full"
				bind:value={editName}
			/>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-address">
				<span class="label-text">Address</span>
			</label>
			<textarea
				id="edit-address"
				class="textarea textarea-bordered textarea-sm w-full"
				rows="3"
				bind:value={editAddress}
			></textarea>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-email">
				<span class="label-text">Email</span>
			</label>
			<input
				id="edit-email"
				type="email"
				class="input input-bordered input-sm w-full"
				bind:value={editEmail}
			/>
		</div>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => editModal.close()}
				>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={saveEdit} disabled={editSaving}>
				{editSaving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Delete Customer Modal -->
<dialog bind:this={deleteModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Delete Customer</h3>
		<p class="mt-4">Are you sure you want to delete <strong>{deleteName}</strong>?</p>
		{#if deleteError}
			<div class="alert alert-error mt-4">
				<span>{deleteError}</span>
			</div>
		{/if}
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => deleteModal.close()}
				>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={confirmDelete} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
