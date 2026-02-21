<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { create_invoice } from '$lib/funcs/invoices.remote';
	import CustomerSelect from '$lib/components/invoice/CustomerSelect.svelte';
	import DateSelect from '$lib/components/invoice/DateSelect.svelte';
	import InvoiceItems from '$lib/components/invoice/InvoiceItems.svelte';
	import InvoiceNumber from '$lib/components/invoice/InvoiceNumber.svelte';
	import { get_rate_settings, get_auto_send_settings } from '$lib/funcs/settings.remote';

	const rateData = get_rate_settings();
	const autoSendData = get_auto_send_settings();
	const autoSendEnabled = $derived(autoSendData.current?.enabled ?? false);
	const defaultPrice = $derived(rateData.current?.hourly_rate ?? 30);

	let invoiceNumber = $state<number>(0);
	let selectedCustomer = $state<string>('');
	let invoiceDate = $state<string>('');
	let dueDate = $state<string>('');
	let items = $state<string>('');
	let itemsTotal = $state(0);
	let autoSend = $state(0);

	const isFutureDate = $derived(invoiceDate ? new Date(invoiceDate) > new Date() : false);

	const initialItems = $derived.by(() => {
		const raw = page.url.searchParams.get('items');
		if (!raw) return undefined;
		try {
			return JSON.parse(raw) as { name: string; description: string; quantity: number }[];
		} catch {
			return undefined;
		}
	});
</script>

<div class="max-w-3xl mx-auto space-y-3 mb-24">
	<!-- Header -->
	<div
		class="rounded-xl p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
	>
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
				<h1 class="text-lg font-bold">New Invoice</h1>
				<div class="flex items-center gap-1 mt-0.5">
					<div class="w-2 h-2 rounded-full bg-primary"></div>
					<span class="text-[11px] font-semibold text-primary">Draft</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Invoice details -->
	<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden">
		<div class="p-4 space-y-3 text-sm">
			<InvoiceNumber bind:value={invoiceNumber} />
			<CustomerSelect bind:value={selectedCustomer} />
			<DateSelect bind:invoiceDate bind:dueDate />
		</div>
	</div>

	<!-- Line items -->
	<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden">
		<div class="px-4 py-3 border-b border-base-content/5">
			<span class="text-xs uppercase tracking-wider text-base-content/40 font-semibold"
				>Line Items</span
			>
		</div>
		<div class="p-4">
			<InvoiceItems bind:value={items} bind:total={itemsTotal} {initialItems} {defaultPrice} />
		</div>
	</div>

	{#if autoSendEnabled && isFutureDate}
		<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden p-4">
			<label class="flex items-center justify-between cursor-pointer">
				<div class="flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info">
						<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" />
					</svg>
					<div>
						<span class="text-sm font-medium">Auto-send on invoice date</span>
						<p class="text-[11px] text-base-content/40">Automatically email this invoice when the date arrives</p>
					</div>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-sm toggle-info"
					checked={autoSend === 1}
					onchange={() => (autoSend = autoSend ? 0 : 1)}
				/>
			</label>
		</div>
	{/if}
</div>

<form {...create_invoice} class="fixed bottom-16 left-0 w-full px-4 pb-2 mb-2">
	<div style="display: none">
		<input {...create_invoice.fields.invoice_number.as('number')} bind:value={invoiceNumber} />
		<input {...create_invoice.fields.customer_id.as('text')} bind:value={selectedCustomer} />
		<input {...create_invoice.fields.invoice_date.as('text')} bind:value={invoiceDate} />
		<input {...create_invoice.fields.due_date.as('text')} bind:value={dueDate} />
		<input {...create_invoice.fields.items.as('text')} bind:value={items} />
		<input {...create_invoice.fields.total.as('number')} bind:value={itemsTotal} />
		<input {...create_invoice.fields.auto_send.as('number')} bind:value={autoSend} />
	</div>

	<button type="submit" class="btn btn-primary btn-sm w-full">Create Invoice</button>
</form>
