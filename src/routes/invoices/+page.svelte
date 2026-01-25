<script>
	import { resolve } from '$app/paths';
	import InvoiceCard from '$lib/components/InvoiceCard.svelte';
	import { get_invoices } from '$lib/funcs/invoices.remote';
</script>

<h1>Invoices</h1>

<a href={resolve('/invoices/new')}>new invoice</a>

{#each await get_invoices() as invoice (invoice.id)}
	<InvoiceCard {invoice} />
	<!-- <div>
		<h2>{invoice.customer_name}</h2>
		<p>INV-{invoice.invoice_number}</p>
		<p>Invoice Date: {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</p>
		<p>Due Date: {new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
		<p>£{invoice.total}</p>
	</div> -->
{/each}
