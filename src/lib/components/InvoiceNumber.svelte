<script lang="ts">
	import { get_next_invoice_number } from '$lib/funcs/invoices.remote';

	let { value = $bindable(0) } = $props();

	const nextInvoiceNumber = await get_next_invoice_number();
	value = nextInvoiceNumber;
</script>

<span>
	INV-
	<input type="number" bind:value />
</span>
