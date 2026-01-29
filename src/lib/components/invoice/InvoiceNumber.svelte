<script lang="ts">
	import { get_next_invoice_number } from '$lib/funcs/invoices.remote';

	let { value = $bindable(0) } = $props();

	const nextInvoiceNumber = await get_next_invoice_number();
	value = nextInvoiceNumber;
</script>

<div>
	<label class="label" for="invoiceNumber">
		<span class="label-text">Invoice Number</span>
	</label>
	<label class="input input-bordered input-sm w-fit flex items-center gap-1">
		<span class="text-base-content/60">INV-</span>
		<input
			id="invoiceNumber"
			type="number"
			class="bg-transparent w-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
			bind:value
		/>
	</label>
</div>
