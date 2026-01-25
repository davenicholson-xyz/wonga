<script lang="ts">
	let { invoice } = $props();
</script>

<div>
	<h2>INV-{invoice.invoice_number}</h2>
	<p>{new Date(invoice.due_date).toLocaleDateString('en-GB')}</p>
	{#if new Date(invoice.due_date) > new Date()}
		<p>
			{Math.floor(
				(new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
			)} days
		</p>
	{/if}
	<p>£{invoice.total}</p>
</div>
