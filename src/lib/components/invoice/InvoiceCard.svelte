<script lang="ts">
	import { resolve } from '$app/paths';
	import { mark_paid } from '$lib/funcs/invoices.remote';

	let { invoice } = $props();

	let dueIn = new Date(invoice.due_date).getTime() - Date.now();
	let dueInDays = Math.ceil(dueIn / (1000 * 60 * 60 * 24));
</script>

<div>
	<h2>{invoice.customer_name}</h2>
	<p>PAID: {invoice.paid}</p>
	<a href={resolve(`/invoices/${invoice.invoice_number}`)}>INV-{invoice.invoice_number}</a>
	<p>Invoice Date: {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</p>
	<p>Due Date: {new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
	<p>Due in <span>{dueInDays}</span> days</p>
	<p>£{invoice.total}</p>
	{#if !invoice.paid}
		<button onclick={() => mark_paid(invoice.id)}>Mark Paid</button>
	{/if}
</div>
