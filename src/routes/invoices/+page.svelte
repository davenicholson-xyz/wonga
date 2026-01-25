<script>
	import { resolve } from '$app/paths';
	import InvoiceCard from '$lib/components/InvoiceCard.svelte';
	import { get_invoices } from '$lib/funcs/invoices.remote';
</script>

<a href={resolve('/invoices/new')}>new invoice</a>

{#each await get_invoices() as invoice (invoice.id)}
	<InvoiceCard {invoice} />
{/each}
