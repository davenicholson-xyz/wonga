<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';
	import { get_invoice, mark_paid, send_invoice } from '$lib/funcs/invoices.remote';
	import { get_payment_settings } from '$lib/funcs/settings.remote';
	const { number } = page.params as { number: string };

	const data = get_invoice(parseInt(number));
	const inv = $derived(data.current);

	const settingsData = get_payment_settings();
	const ps = $derived(settingsData.current);

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
			{#if !inv.paid}
				<button class="btn btn-primary btn-sm" onclick={() => mark_paid(inv.id)}>
					Mark as Paid
				</button>
			{/if}
		</div>

		<!-- Invoice document -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-6 pt-5 text-sm">
				<!-- From + Invoice info -->
				{#if ps?.payment_name || ps?.address || ps?.email}
					<div class="space-y-0.5 text-base-content/70 mb-4">
						{#if ps.payment_name}
							<p class="font-medium text-base-content">{ps.payment_name}</p>
						{/if}
						{#if ps.address}
							{#each ps.address.split('\n') as line (line)}
								<p>{line}</p>
							{/each}
						{/if}
						{#if ps.email}
							<p>{ps.email}</p>
						{/if}
					</div>
				{/if}

				<!-- Invoice info + Customer -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<div>
						<div class="space-y-0.5 text-base-content/70">
							<p>
								<span class="font-medium text-base-content">Number:</span> INV-{inv.invoice_number}
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

				<!-- Items table -->
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

				<!-- Total -->
				<div class="flex justify-end">
					<div class="text-right">
						<div class="text-xs text-base-content/50 uppercase tracking-wide">Total</div>
						<div class="text-lg font-bold">{formatCurrency(inv.total)}</div>
					</div>
				</div>

				<!-- Payment details -->
				{#if ps?.payment_name || ps?.account_number || ps?.sort_code}
					<div class="divider my-3"></div>
					<div>
						<h2 class="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2">
							Payment Details
						</h2>
						<div class="space-y-0.5 text-base-content/70">
							{#if ps.payment_name}
								<p><span class="font-medium text-base-content">Pay to:</span> {ps.payment_name}</p>
							{/if}
							{#if ps.account_number}
								<p>
									<span class="font-medium text-base-content">Account:</span>
									{ps.account_number}
								</p>
							{/if}
							{#if ps.sort_code}
								<p><span class="font-medium text-base-content">Sort Code:</span> {ps.sort_code}</p>
							{/if}
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
