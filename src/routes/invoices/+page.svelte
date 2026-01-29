<script>
	import { resolve } from '$app/paths';
	import InvoiceCard from '$lib/components/InvoiceCard.svelte';
	import { get_invoices } from '$lib/funcs/invoices.remote';
</script>

<a href={resolve('/invoices/new')}>new invoice</a>

<p>
	this page will group the invoices by month and have a card above to show montly income and be able
	to adjust tax amount for the month
</p>
{#each await get_invoices() as invoice (invoice.id)}
	<InvoiceCard {invoice} />
{/each}
