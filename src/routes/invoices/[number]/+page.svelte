<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';
	import {
		get_invoice,
		mark_paid,
		send_invoice,
		update_invoice,
		delete_invoice
	} from '$lib/funcs/invoices.remote';
	import { get_customers } from '$lib/funcs/customers.remote';
	const { number } = page.params as { number: string };

	const data = get_invoice(parseInt(number));
	const inv = $derived(data.current);

	const customersData = get_customers();
	const customers = $derived(customersData.current ?? []);

	type InvoiceItem = {
		name: string;
		description: string;
		price: number;
		quantity: number;
	};

	const items = $derived<InvoiceItem[]>(inv ? JSON.parse(inv.items) : []);

	let sending = $state(false);
	let uploading = $state(false);
	let fileInput: HTMLInputElement;

	let showTimesheetWarning = $state(false);
	let showDeleteConfirm = $state(false);

	// Edit mode state
	let editing = $state(false);
	let editCustomerId = $state('');
	let editInvoiceDate = $state('');
	let editDueDate = $state('');
	let editItems = $state<InvoiceItem[]>([]);

	// Edit item modal state
	let showEditItemModal = $state(false);
	let editItemIndex = $state(0);
	let editItemName = $state('');
	let editItemDesc = $state('');
	let editItemPrice = $state(0);
	let editItemQty = $state(0);

	// New item modal state
	let showNewItemModal = $state(false);
	let newItemName = $state('');
	let newItemDesc = $state('');
	let newItemPrice = $state(30);
	let newItemQty = $state(1);

	const editTotal = $derived(editItems.reduce((sum, i) => sum + i.price * i.quantity, 0));

	function startEditing() {
		if (!inv) return;
		editCustomerId = inv.customer_id ?? '';
		editInvoiceDate = new Date(inv.invoice_date).toISOString().split('T')[0];
		editDueDate = new Date(inv.due_date).toISOString().split('T')[0];
		editItems = JSON.parse(inv.items).map((i: InvoiceItem) => ({ ...i }));
		editing = true;
	}

	function cancelEditing() {
		editing = false;
	}

	async function saveEditing() {
		if (!inv) return;
		await update_invoice({
			id: inv.id,
			invoice_number: inv.invoice_number,
			customer_id: editCustomerId,
			invoice_date: editInvoiceDate,
			due_date: editDueDate,
			items: JSON.stringify(
				editItems.map(({ name, description, price, quantity }) => ({
					name,
					description,
					price,
					quantity
				}))
			),
			total: editTotal
		});
		editing = false;
	}

	function openEditItemModal(index: number) {
		const item = editItems[index];
		editItemIndex = index;
		editItemName = item.name;
		editItemDesc = item.description;
		editItemPrice = item.price;
		editItemQty = item.quantity;
		showEditItemModal = true;
	}

	function saveEditItem() {
		editItems[editItemIndex] = {
			name: editItemName,
			description: editItemDesc,
			price: editItemPrice,
			quantity: editItemQty
		};
		showEditItemModal = false;
	}

	function removeEditItem() {
		editItems.splice(editItemIndex, 1);
		showEditItemModal = false;
	}

	function openNewItemModal() {
		newItemName = '';
		newItemDesc = '';
		newItemPrice = 30;
		newItemQty = 1;
		showNewItemModal = true;
	}

	function addNewItem() {
		editItems.push({
			name: newItemName,
			description: newItemDesc,
			price: newItemPrice,
			quantity: newItemQty
		});
		showNewItemModal = false;
	}

	async function confirmDelete() {
		if (!inv) return;
		await delete_invoice({ id: inv.id, invoice_number: inv.invoice_number });
		window.location.href = resolve('/invoices');
	}

	async function emailInvoice() {
		if (!inv?.timesheet_image) {
			showTimesheetWarning = true;
			return;
		}
		await doSendInvoice();
	}

	async function doSendInvoice() {
		showTimesheetWarning = false;
		sending = true;
		try {
			await send_invoice(parseInt(number));
		} finally {
			sending = false;
		}
	}

	async function uploadTimesheet(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			await fetch(resolve(`/invoices/${number}/upload`), { method: 'POST', body: formData });
			data.refresh();
		} finally {
			uploading = false;
			input.value = '';
		}
	}
</script>

{#if inv}
	<div class="max-w-3xl mx-auto space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<a href={resolve('/invoices')} class="btn btn-ghost btn-sm">← Back</a>
				<h1 class="text-lg font-bold">INV-{inv.invoice_number}</h1>
				{#if inv.paid}
					<span class="badge badge-success badge-sm">Paid</span>
				{:else}
					<span class="badge badge-warning badge-sm">Unpaid</span>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				{#if editing}
					<button class="btn btn-ghost btn-sm" onclick={cancelEditing}>Cancel</button>
					<button class="btn btn-primary btn-sm" onclick={saveEditing}>Save</button>
				{:else}
					{#if !inv.paid}
						<button
							class="btn btn-ghost btn-sm btn-square text-success"
							onclick={() => mark_paid(inv.id)}
							title="Mark as Paid"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					{/if}
					<button class="btn btn-ghost btn-sm btn-square" onclick={startEditing} title="Edit">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="size-4"
						>
							<path
								d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"
							/>
							<path
								d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z"
							/>
						</svg>
					</button>
					<button
						class="btn btn-ghost btn-sm btn-square text-error"
						onclick={() => (showDeleteConfirm = true)}
						title="Delete"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="size-4"
						>
							<path
								fill-rule="evenodd"
								d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.8l-.35 5.25a.75.75 0 0 1-1.497-.1l.35-5.25a.75.75 0 0 1 .797-.7Zm3.64.7a.75.75 0 0 0-1.497.1l.35 5.25a.75.75 0 0 0 1.497-.1l-.35-5.25Z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Invoice document -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-6 pt-5 text-sm">
				{#if editing}
					<!-- Edit mode -->
					<div class="space-y-3">
						<div class="form-control">
							<label class="label"><span class="label-text">Customer</span></label>
							<select class="select select-bordered select-sm" bind:value={editCustomerId}>
								{#each customers as c (c.id)}
									<option value={c.id}>{c.name}</option>
								{/each}
							</select>
						</div>
						<div class="flex gap-3">
							<div class="form-control flex-1">
								<label class="label"><span class="label-text">Invoice Date</span></label>
								<input
									type="date"
									class="input input-bordered input-sm"
									bind:value={editInvoiceDate}
								/>
							</div>
							<div class="form-control flex-1">
								<label class="label"><span class="label-text">Due Date</span></label>
								<input type="date" class="input input-bordered input-sm" bind:value={editDueDate} />
							</div>
						</div>

						<div class="divider my-1"></div>

						<table class="table table-xs">
							<thead>
								<tr class="text-base-content/50 uppercase tracking-wide text-xs">
									<th>Item</th>
									<th class="text-right">Qty</th>
									<th class="text-right">Price</th>
									<th class="text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								{#each editItems as item, i}
									<tr class="cursor-pointer hover" onclick={() => openEditItemModal(i)}>
										<td>
											<div class="font-medium">{item.name}</div>
											{#if item.description}
												<div class="text-xs text-base-content/60">{item.description}</div>
											{/if}
										</td>
										<td class="text-right">{item.quantity}</td>
										<td class="text-right">{formatCurrency(item.price)}</td>
										<td class="text-right">{formatCurrency(item.price * item.quantity)}</td>
									</tr>
								{/each}
							</tbody>
						</table>

						<button class="btn btn-ghost btn-sm w-full opacity-50" onclick={openNewItemModal}
							>+ Add Item</button
						>

						<div class="divider my-1"></div>
						<div class="flex justify-end">
							<div class="text-right">
								<div class="text-xs text-base-content/50 uppercase tracking-wide">Total</div>
								<div class="text-lg font-bold">{formatCurrency(editTotal)}</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- View mode -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div>
							<div class="space-y-0.5 text-base-content/70">
								<p>
									<span class="font-medium text-base-content">Number:</span>
									INV-{inv.invoice_number}
								</p>
								<p>
									<span class="font-medium text-base-content">Date:</span>
									{new Date(inv.invoice_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</p>
								<p>
									<span class="font-medium text-base-content">Due:</span>
									{new Date(inv.due_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</p>
							</div>
						</div>
						<div class="sm:text-right">
							<h2 class="text-sm font-bold mb-1 text-base-content/50 uppercase tracking-wide">
								Bill To
							</h2>
							<div class="space-y-0.5 text-base-content/70">
								<p class="font-medium text-base-content">{inv.customer_name}</p>
								{#if inv.customer_address}
									{#each inv.customer_address.split('\n') as line (line)}
										<p>{line}</p>
									{/each}
								{/if}
								{#if inv.customer_email}
									<p>{inv.customer_email}</p>
								{/if}
							</div>
						</div>
					</div>

					<div class="divider my-3"></div>

					<table class="table table-xs">
						<thead>
							<tr class="text-base-content/50 uppercase tracking-wide text-xs">
								<th>Item</th>
								<th class="text-right">Qty</th>
								<th class="text-right">Price</th>
								<th class="text-right">Total</th>
							</tr>
						</thead>
						<tbody>
							{#each items as item}
								<tr>
									<td>
										<div class="font-medium">{item.name}</div>
										{#if item.description}
											<div class="text-xs text-base-content/60">{item.description}</div>
										{/if}
									</td>
									<td class="text-right">{item.quantity}</td>
									<td class="text-right">{formatCurrency(item.price)}</td>
									<td class="text-right">{formatCurrency(item.price * item.quantity)}</td>
								</tr>
							{/each}
						</tbody>
					</table>

					<div class="divider my-2"></div>

					<div class="flex justify-end">
						<div class="text-right">
							<div class="text-xs text-base-content/50 uppercase tracking-wide">Total</div>
							<div class="text-lg font-bold">{formatCurrency(inv.total)}</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Timesheet image -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-6 pt-5">
				{#if inv.timesheet_image}
					<img
						src={resolve(`/uploads/${inv.timesheet_image}`)}
						alt="Timesheet"
						class="rounded-lg w-full"
					/>
					<button
						class="btn btn-ghost btn-sm mt-2 w-full opacity-50"
						onclick={() => fileInput.click()}
						disabled={uploading}
					>
						{uploading ? 'Uploading...' : 'Replace Image'}
					</button>
				{:else}
					<button
						class="btn btn-ghost btn-sm w-full opacity-50"
						onclick={() => fileInput.click()}
						disabled={uploading}
					>
						{uploading ? 'Uploading...' : '+ Upload Timesheet Image'}
					</button>
				{/if}
				<input
					bind:this={fileInput}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					class="hidden"
					onchange={uploadTimesheet}
				/>
			</div>
		</div>

		<div class="flex gap-2">
			<a href={resolve(`/invoices/${number}/pdf`)} class="btn btn-primary btn-sm flex-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" y1="13" x2="8" y2="13" />
					<line x1="16" y1="17" x2="8" y2="17" />
				</svg>
				Generate PDF
			</a>
			<button
				class="btn btn-secondary btn-sm flex-1"
				onclick={emailInvoice}
				disabled={sending || inv.emailed}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="20" height="16" x="2" y="4" rx="2" />
					<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
				</svg>
				{#if sending}
					Sending...
				{:else if inv.emailed}
					Emailed
				{:else}
					Email Invoice
				{/if}
			</button>
		</div>
	</div>

	<!-- Edit item modal -->
	<dialog class="modal" class:modal-open={showEditItemModal}>
		<div class="modal-box">
			<h3 class="font-bold text-lg">Edit Item</h3>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveEditItem();
				}}
			>
				<div class="form-control mt-4">
					<label class="label"><span class="label-text">Name</span></label>
					<input type="text" class="input input-bordered input-sm" bind:value={editItemName} />
				</div>
				<div class="form-control mt-2">
					<label class="label"><span class="label-text">Description</span></label>
					<input type="text" class="input input-bordered input-sm" bind:value={editItemDesc} />
				</div>
				<div class="flex gap-3 mt-2">
					<div class="form-control grow">
						<label class="label"><span class="label-text">Price</span></label>
						<label class="input input-bordered input-sm flex items-center gap-1">
							<span class="text-base-content/60">£</span>
							<input type="number" class="grow bg-transparent w-full" bind:value={editItemPrice} />
						</label>
					</div>
					<div class="form-control grow">
						<label class="label"><span class="label-text">Quantity</span></label>
						<input type="number" class="input input-bordered input-sm" bind:value={editItemQty} />
					</div>
				</div>
				<div class="modal-action justify-between">
					<button type="button" class="btn btn-error btn-sm" onclick={removeEditItem}>Delete</button
					>
					<div class="flex gap-2">
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => (showEditItemModal = false)}>Cancel</button
						>
						<button type="submit" class="btn btn-primary btn-sm">Save</button>
					</div>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showEditItemModal = false)}>close</button>
		</form>
	</dialog>

	<!-- New item modal -->
	<dialog class="modal" class:modal-open={showNewItemModal}>
		<div class="modal-box">
			<h3 class="font-bold text-lg">Add Item</h3>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addNewItem();
				}}
			>
				<div class="form-control mt-4">
					<label class="label"><span class="label-text">Name</span></label>
					<input type="text" class="input input-bordered input-sm" bind:value={newItemName} />
				</div>
				<div class="form-control mt-2">
					<label class="label"><span class="label-text">Description</span></label>
					<input type="text" class="input input-bordered input-sm" bind:value={newItemDesc} />
				</div>
				<div class="flex gap-3 mt-2">
					<div class="form-control grow">
						<label class="label"><span class="label-text">Price</span></label>
						<label class="input input-bordered input-sm flex items-center gap-1">
							<span class="text-base-content/60">£</span>
							<input type="number" class="grow bg-transparent w-full" bind:value={newItemPrice} />
						</label>
					</div>
					<div class="form-control grow">
						<label class="label"><span class="label-text">Quantity</span></label>
						<input type="number" class="input input-bordered input-sm" bind:value={newItemQty} />
					</div>
				</div>
				<div class="modal-action">
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onclick={() => (showNewItemModal = false)}>Cancel</button
					>
					<button type="submit" class="btn btn-primary btn-sm">Add</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showNewItemModal = false)}>close</button>
		</form>
	</dialog>

	<!-- Delete confirmation modal -->
	<dialog class="modal" class:modal-open={showDeleteConfirm}>
		<div class="modal-box">
			<h3 class="font-bold text-lg">Delete Invoice</h3>
			<p class="py-4 text-sm text-base-content/70">
				Are you sure you want to delete INV-{inv.invoice_number}? This cannot be undone.
			</p>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={() => (showDeleteConfirm = false)}
					>Cancel</button
				>
				<button class="btn btn-error btn-sm" onclick={confirmDelete}>Delete</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showDeleteConfirm = false)}>close</button>
		</form>
	</dialog>

	<dialog class="modal" class:modal-open={showTimesheetWarning}>
		<div class="modal-box">
			<h3 class="font-bold text-lg">No Timesheet Attached</h3>
			<p class="py-4 text-sm text-base-content/70">
				This invoice has no timesheet image attached. Do you still want to send it?
			</p>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={() => (showTimesheetWarning = false)}>
					Cancel
				</button>
				<button class="btn btn-primary btn-sm" onclick={doSendInvoice}> Send Anyway </button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showTimesheetWarning = false)}>close</button>
		</form>
	</dialog>
{/if}
