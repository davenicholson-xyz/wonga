<script lang="ts">
	import { create_invoice } from '$lib/funcs/invoices.remote';
	import CustomerSelect from '$lib/components/invoice/CustomerSelect.svelte';
	import DateSelect from '$lib/components/invoice/DateSelect.svelte';
	import InvoiceItems from '$lib/components/invoice/InvoiceItems.svelte';
	import InvoiceNumber from '$lib/components/invoice/InvoiceNumber.svelte';

	let invoiceNumber = $state<number>(0);
	let selectedCustomer = $state<string>('');
	let invoiceDate = $state<string>('');
	let dueDate = $state<string>('');
	let items = $state<string>('');
	let itemsTotal = $state(0);
</script>

<div class="mx-2 mt-2">
	<div class="card">
		<div class="card-body p-4">
			<h2 class="card-title text-lg mb-2">New Invoice</h2>

			<div class="form-control">
				<InvoiceNumber bind:value={invoiceNumber} />
			</div>

			<div class="form-control mt-3">
				<CustomerSelect bind:value={selectedCustomer} />
			</div>

			<div class="form-control mt-3">
				<DateSelect bind:invoiceDate bind:dueDate />
			</div>

			<div class="form-control mt-3">
				<InvoiceItems bind:value={items} bind:total={itemsTotal} />
			</div>
		</div>
	</div>
</div>

<form {...create_invoice} class="fixed bottom-16 left-0 w-full px-4 pb-2 mb-2">
	<div style="display: none">
		<input {...create_invoice.fields.invoice_number.as('number')} bind:value={invoiceNumber} />
		<input {...create_invoice.fields.customer_id.as('text')} bind:value={selectedCustomer} />
		<input {...create_invoice.fields.invoice_date.as('text')} bind:value={invoiceDate} />
		<input {...create_invoice.fields.due_date.as('text')} bind:value={dueDate} />
		<input {...create_invoice.fields.items.as('text')} bind:value={items} />
		<input {...create_invoice.fields.total.as('number')} bind:value={itemsTotal} />
	</div>

	<button type="submit" class="btn btn-primary btn-sm w-full">Create Invoice</button>
</form>
