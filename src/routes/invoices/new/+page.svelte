<script lang="ts">
	import { create_invoice } from '$lib/funcs/invoices.remote';
	import CustomerSelect from '$lib/components/CustomerSelect.svelte';
	import DateSelect from '$lib/components/DateSelect.svelte';
	import InvoiceItems from '$lib/components/InvoiceItems.svelte';
	import InvoiceNumber from '$lib/components/InvoiceNumber.svelte';

	let invoiceNumber = $state<number>(0);
	let selectedCustomer = $state<string>('');
	let invoiceDate = $state<string>('');
	let dueDate = $state<string>('');
	let items = $state<string>('');
	let itemsTotal = $state(0);
</script>

<h1>New Invoice</h1>

<div>
	<InvoiceNumber bind:value={invoiceNumber} />
</div>
<div>
	<CustomerSelect bind:value={selectedCustomer} />
</div>

<div>
	<DateSelect bind:invoiceDate bind:dueDate />
</div>

<div>
	<InvoiceItems bind:value={items} bind:total={itemsTotal} />
</div>

<form {...create_invoice}>
	<div style="display: none">
		<input {...create_invoice.fields.invoice_number.as('number')} bind:value={invoiceNumber} />
		<input {...create_invoice.fields.customer_id.as('text')} bind:value={selectedCustomer} />
		<input {...create_invoice.fields.invoice_date.as('text')} bind:value={invoiceDate} />
		<input {...create_invoice.fields.due_date.as('text')} bind:value={dueDate} />
		<input {...create_invoice.fields.items.as('text')} bind:value={items} />
		<input {...create_invoice.fields.total.as('number')} bind:value={itemsTotal} />
	</div>

	<button type="submit">Create Invoice</button>
</form>
