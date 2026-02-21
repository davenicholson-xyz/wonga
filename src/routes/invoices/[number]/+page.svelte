<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';
	import {
		get_invoice,
		mark_paid,
		send_invoice,
		update_invoice,
		delete_invoice,
		toggle_auto_send
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
	const isPaid = $derived(!!inv?.paid);
	const isOverdue = $derived(!inv?.paid && inv ? new Date(inv.due_date) < new Date() : false);

	let sending = $state(false);
	let uploading = $state(false);
	let rotating = $state(false);
	let fileInput = $state<HTMLInputElement>();

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

	async function rotateImage() {
		rotating = true;
		try {
			await fetch(resolve(`/invoices/${number}/rotate`), { method: 'POST' });
			// Force image reload by refreshing data
			data.refresh();
		} finally {
			rotating = false;
		}
	}
</script>

{#if inv}
	<div class="max-w-3xl mx-auto space-y-6">
		<!-- Header -->
		<div
			class="rounded-xl p-4 bg-gradient-to-br {isPaid
				? 'from-success/10 to-success/5 border border-success/20'
				: isOverdue
					? 'from-error/10 to-error/5 border border-error/20'
					: 'from-primary/10 to-primary/5 border border-primary/20'}"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href={resolve('/invoices')}
						class="btn btn-ghost btn-sm btn-square"
						aria-label="Back to invoices"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-5 h-5"
						>
							<path
								fill-rule="evenodd"
								d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<div>
						<h1 class="text-lg font-bold font-mono">INV-{inv.invoice_number}</h1>
						<div class="flex items-center gap-2 mt-0.5">
							{#if isPaid}
								<div class="flex items-center gap-1">
									<div class="w-2 h-2 rounded-full bg-success"></div>
									<span class="text-[11px] font-semibold text-success">Paid</span>
								</div>
							{:else if isOverdue}
								<div class="flex items-center gap-1">
									<div class="w-2 h-2 rounded-full bg-error animate-pulse"></div>
									<span class="text-[11px] font-semibold text-error">Overdue</span>
								</div>
							{:else}
								<div class="flex items-center gap-1">
									<div class="w-2 h-2 rounded-full bg-primary"></div>
									<span class="text-[11px] font-semibold text-primary">Pending</span>
								</div>
							{/if}
							{#if inv.emailed}
								<div class="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="w-3 h-3 text-warning"
									>
										<path
											d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"
										/>
										<path
											d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"
										/>
									</svg>
									<span class="text-[11px] text-warning">Sent</span>
								</div>
							{/if}
							{#if inv.auto_send && !inv.emailed}
								<div class="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="w-3 h-3 text-info"
									>
										<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" />
									</svg>
									<span class="text-[11px] text-info">Auto-send</span>
								</div>
							{/if}
						</div>
					</div>
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
		</div>

		<!-- Invoice document -->
		<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden">
			{#if editing}
				<div class="p-5 text-sm space-y-3">
					<div class="form-control">
						<label class="label" for="edit-customer"><span class="label-text">Customer</span></label
						>
						<select
							id="edit-customer"
							class="select select-bordered select-sm"
							bind:value={editCustomerId}
						>
							{#each customers as c (c.id)}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex gap-3">
						<div class="form-control flex-1">
							<label class="label" for="edit-invoice-date"
								><span class="label-text">Invoice Date</span></label
							>
							<input
								id="edit-invoice-date"
								type="date"
								class="input input-bordered input-sm"
								bind:value={editInvoiceDate}
							/>
						</div>
						<div class="form-control flex-1">
							<label class="label" for="edit-due-date"
								><span class="label-text">Due Date</span></label
							>
							<input
								id="edit-due-date"
								type="date"
								class="input input-bordered input-sm"
								bind:value={editDueDate}
							/>
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
				<!-- Details section -->
				<div class="p-5 text-sm">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-3">
							<div>
								<div
									class="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold mb-0.5"
								>
									Invoice Date
								</div>
								<div class="text-sm text-base-content/80">
									{new Date(inv.invoice_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</div>
							</div>
							<div>
								<div
									class="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold mb-0.5"
								>
									Due Date
								</div>
								<div
									class="text-sm {isOverdue ? 'text-error font-medium' : 'text-base-content/80'}"
								>
									{new Date(inv.due_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div
								class="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold mb-0.5"
							>
								Bill To
							</div>
							<div class="space-y-0.5 text-base-content/80">
								<p class="font-medium text-base-content">{inv.customer_name}</p>
								{#if inv.customer_address}
									{#each inv.customer_address.split('\n') as line (line)}
										<p class="text-xs">{line}</p>
									{/each}
								{/if}
								{#if inv.customer_email}
									<p class="text-xs">{inv.customer_email}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Line items -->
				<div class="border-t border-base-content/5">
					{#each items as item, i}
						<div
							class="flex items-center gap-3 px-5 py-3 {i < items.length - 1
								? 'border-b border-base-content/5'
								: ''}"
						>
							<div
								class="w-8 h-8 rounded-lg bg-base-content/5 flex items-center justify-center shrink-0"
							>
								<span class="text-xs font-bold text-base-content/30">{i + 1}</span>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium">{item.name}</div>
								{#if item.description}
									<div class="text-[11px] text-base-content/50">{item.description}</div>
								{/if}
							</div>
							<div class="text-right shrink-0">
								<div class="text-sm font-semibold">
									{formatCurrency(item.price * item.quantity)}
								</div>
								<div class="text-[11px] text-base-content/40">
									{item.quantity} x {formatCurrency(item.price)}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Total -->
				<div
					class="border-t border-base-content/10 bg-gradient-to-r {isPaid
						? 'from-success/5 to-transparent'
						: isOverdue
							? 'from-error/5 to-transparent'
							: 'from-primary/5 to-transparent'} px-5 py-4"
				>
					<div class="flex items-center justify-between">
						<span class="text-xs uppercase tracking-wider text-base-content/40 font-semibold"
							>Total</span
						>
						<span
							class="text-xl font-bold {isPaid ? 'text-success' : isOverdue ? 'text-error' : ''}"
							>{formatCurrency(inv.total)}</span
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Timesheet image -->
		<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden">
			{#if inv.timesheet_image}
				<div class="relative">
					<img
						src={resolve(`/uploads/${inv.timesheet_image}?t=${Date.now()}`)}
						alt="Timesheet"
						class="w-full"
					/>
					<button
						class="btn btn-ghost btn-sm btn-square absolute top-2 right-2 bg-base-100/80 hover:bg-base-100"
						onclick={rotateImage}
						title="Rotate image"
						disabled={rotating}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-4 h-4 {rotating ? 'animate-spin' : ''}"
						>
							<path
								fill-rule="evenodd"
								d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
				<div class="p-3 border-t border-base-content/5">
					<button
						class="btn btn-ghost btn-sm w-full text-base-content/40"
						onclick={() => fileInput?.click()}
						disabled={uploading}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-4 h-4"
						>
							<path
								d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z"
							/>
							<path
								d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
							/>
						</svg>
						{uploading ? 'Uploading...' : 'Replace Image'}
					</button>
				</div>
			{:else}
				<div class="p-8 flex flex-col items-center gap-2">
					<div class="w-10 h-10 rounded-xl bg-base-content/5 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-5 h-5 text-base-content/30"
						>
							<path
								fill-rule="evenodd"
								d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0L2.5 11.06Zm8-1.06a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<button
						class="btn btn-ghost btn-sm text-base-content/40"
						onclick={() => fileInput?.click()}
						disabled={uploading}
					>
						{uploading ? 'Uploading...' : 'Upload Timesheet Image'}
					</button>
				</div>
			{/if}
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				class="hidden"
				onchange={uploadTimesheet}
			/>
		</div>

		<!-- Auto-send toggle -->
		{#if !inv.emailed}
			<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
				<label class="flex items-center justify-between cursor-pointer">
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info">
							<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" />
						</svg>
						<div>
							<span class="text-sm font-medium">Auto-send</span>
							<p class="text-[11px] text-base-content/40">Automatically email when invoice date arrives</p>
						</div>
					</div>
					<input
						type="checkbox"
						class="toggle toggle-sm toggle-info"
						checked={!!inv.auto_send}
						onchange={() => toggle_auto_send({ id: inv.id, invoice_number: inv.invoice_number, auto_send: inv.auto_send })}
					/>
				</label>
			</div>
		{/if}

		<!-- Actions -->
		<div class="grid grid-cols-2 gap-2">
			<a
				href={resolve(`/invoices/${number}/pdf`)}
				class="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3 flex items-center gap-2.5 transition-all hover:shadow-md"
			>
				<div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-4 h-4 text-primary"
					>
						<path
							fill-rule="evenodd"
							d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-sm font-semibold text-primary">Generate PDF</span>
			</a>
			<button
				class="rounded-xl bg-gradient-to-br {inv.emailed
					? 'from-success/10 to-success/5 border border-success/20'
					: 'from-warning/10 to-warning/5 border border-warning/20'} p-3 flex items-center gap-2.5 transition-all hover:shadow-md text-left"
				onclick={emailInvoice}
				disabled={sending || !!inv.emailed}
			>
				<div
					class="w-8 h-8 rounded-lg {inv.emailed
						? 'bg-success/20'
						: 'bg-warning/20'} flex items-center justify-center shrink-0"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-4 h-4 {inv.emailed ? 'text-success' : 'text-warning'}"
					>
						<path
							d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"
						/>
						<path
							d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"
						/>
					</svg>
				</div>
				<span class="text-sm font-semibold {inv.emailed ? 'text-success' : 'text-warning'}">
					{#if sending}
						Sending...
					{:else if inv.emailed}
						Emailed
					{:else}
						Email Invoice
					{/if}
				</span>
			</button>
		</div>
	</div>

	<!-- Edit item modal -->
	<dialog class="modal" class:modal-open={showEditItemModal}>
		<div class="modal-box p-0 overflow-hidden">
			<div class="bg-gradient-to-br from-primary/15 to-primary/5 px-5 py-4">
				<h3 class="font-bold text-lg">Edit Item</h3>
			</div>
			<form
				class="px-5 py-4"
				onsubmit={(e) => {
					e.preventDefault();
					saveEditItem();
				}}
			>
				<div class="form-control">
					<label class="label" for="edit-item-name"><span class="label-text">Name</span></label>
					<input
						id="edit-item-name"
						type="text"
						class="input input-bordered input-sm"
						bind:value={editItemName}
					/>
				</div>
				<div class="form-control mt-2">
					<label class="label" for="edit-item-desc"
						><span class="label-text">Description</span></label
					>
					<input
						id="edit-item-desc"
						type="text"
						class="input input-bordered input-sm"
						bind:value={editItemDesc}
					/>
				</div>
				<div class="flex gap-3 mt-2">
					<div class="form-control grow">
						<label class="label" for="edit-item-price"><span class="label-text">Price</span></label>
						<div class="input input-bordered input-sm flex items-center gap-1">
							<span class="text-base-content/60">£</span>
							<input
								id="edit-item-price"
								type="number"
								class="grow bg-transparent w-full"
								bind:value={editItemPrice}
							/>
						</div>
					</div>
					<div class="form-control grow">
						<label class="label" for="edit-item-qty"><span class="label-text">Quantity</span></label
						>
						<input
							id="edit-item-qty"
							type="number"
							class="input input-bordered input-sm"
							bind:value={editItemQty}
						/>
					</div>
				</div>
				<div class="flex justify-between mt-5">
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
		<div class="modal-box p-0 overflow-hidden">
			<div class="bg-gradient-to-br from-info/15 to-info/5 px-5 py-4">
				<h3 class="font-bold text-lg">Add Item</h3>
			</div>
			<form
				class="px-5 py-4"
				onsubmit={(e) => {
					e.preventDefault();
					addNewItem();
				}}
			>
				<div class="form-control">
					<label class="label" for="new-item-name"><span class="label-text">Name</span></label>
					<input
						id="new-item-name"
						type="text"
						class="input input-bordered input-sm"
						bind:value={newItemName}
					/>
				</div>
				<div class="form-control mt-2">
					<label class="label" for="new-item-desc"
						><span class="label-text">Description</span></label
					>
					<input
						id="new-item-desc"
						type="text"
						class="input input-bordered input-sm"
						bind:value={newItemDesc}
					/>
				</div>
				<div class="flex gap-3 mt-2">
					<div class="form-control grow">
						<label class="label" for="new-item-price"><span class="label-text">Price</span></label>
						<div class="input input-bordered input-sm flex items-center gap-1">
							<span class="text-base-content/60">£</span>
							<input
								id="new-item-price"
								type="number"
								class="grow bg-transparent w-full"
								bind:value={newItemPrice}
							/>
						</div>
					</div>
					<div class="form-control grow">
						<label class="label" for="new-item-qty"><span class="label-text">Quantity</span></label>
						<input
							id="new-item-qty"
							type="number"
							class="input input-bordered input-sm"
							bind:value={newItemQty}
						/>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-5">
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
		<div class="modal-box p-0 overflow-hidden">
			<div class="bg-gradient-to-br from-error/15 to-error/5 px-5 py-4">
				<h3 class="font-bold text-lg">Delete Invoice</h3>
			</div>
			<div class="px-5 py-4">
				<p class="text-sm text-base-content/70">
					Are you sure you want to delete INV-{inv.invoice_number}? This cannot be undone.
				</p>
				<div class="flex justify-end gap-2 mt-5">
					<button class="btn btn-ghost btn-sm" onclick={() => (showDeleteConfirm = false)}
						>Cancel</button
					>
					<button class="btn btn-error btn-sm" onclick={confirmDelete}>Delete</button>
				</div>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showDeleteConfirm = false)}>close</button>
		</form>
	</dialog>

	<!-- Timesheet warning modal -->
	<dialog class="modal" class:modal-open={showTimesheetWarning}>
		<div class="modal-box p-0 overflow-hidden">
			<div class="bg-gradient-to-br from-warning/15 to-warning/5 px-5 py-4">
				<h3 class="font-bold text-lg">No Timesheet Attached</h3>
			</div>
			<div class="px-5 py-4">
				<p class="text-sm text-base-content/70">
					This invoice has no timesheet image attached. Do you still want to send it?
				</p>
				<div class="flex justify-end gap-2 mt-5">
					<button class="btn btn-ghost btn-sm" onclick={() => (showTimesheetWarning = false)}
						>Cancel</button
					>
					<button class="btn btn-primary btn-sm" onclick={doSendInvoice}>Send Anyway</button>
				</div>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showTimesheetWarning = false)}>close</button>
		</form>
	</dialog>
{/if}
