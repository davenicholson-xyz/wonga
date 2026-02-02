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
			<span class="font-mono text-xs inline-flex items-center gap-1">
				INV-{invoice.invoice_number}
			</span>

			<span class="pl-3 flex flex-1">
				{#if invoice.paid}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-3 text-success"
						title="Paid"
					>
						<path
							d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603c-.481.085-.876.298-1.124.549-.26.265-.356.544-.356.787 0 .243.096.522.356.787l.204-.106Z"
						/>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.19 2.19 0 0 0-.736-.363V9.3c.514.093 1.01.265 1.459.525.69.399 1.291 1.02 1.291 1.925s-.601 1.526-1.291 1.925a4.63 4.63 0 0 1-1.459.525v.316a.75.75 0 0 1-1.5 0v-.316a3.78 3.78 0 0 1-1.653-.713 2.72 2.72 0 0 1-.925-1.2.75.75 0 0 1 1.395-.55c.12.302.294.508.447.563.217.12.465.209.736.363V10.7a4.63 4.63 0 0 1-1.459-.525C6.601 9.776 6 9.156 6 8.25s.601-1.526 1.291-1.925A4.63 4.63 0 0 1 8.75 5.8v-.316A.75.75 0 0 1 9.5 4.734L10 4Z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if new Date(invoice.due_date) < new Date()}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-3 text-error"
						title="Overdue"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				{#if invoice.emailed}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-3 text-warning"
						title="Emailed"
					>
						<path
							d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"
						/>
						<path
							d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"
						/>
					</svg>
				{/if}
			</span>
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
