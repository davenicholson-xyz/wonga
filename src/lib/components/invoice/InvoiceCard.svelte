<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';

	let { invoice } = $props();
</script>

<a
	href={resolve(`/invoices/${invoice.invoice_number}`)}
	class="card bg-base-100 shadow-sm border border-base-100 hover:shadow-md transition-shadow"
>
	<div class="card-body px-3 py-2 gap-0">
		<div class="flex items-center justify-between">
			<span class="font-mono text-xs">INV-{invoice.invoice_number}</span>
			<span class="text-xs font-semibold">{formatCurrency(invoice.total)}</span>
		</div>
		<div class="flex items-center justify-between text-xs text-base-content/60">
			<span>{invoice.customer_name}</span>
			<span>
				{new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})}
			</span>
		</div>
	</div>
</a>
