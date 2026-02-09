<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';

	let { invoice } = $props();

	const isPaid = $derived(invoice.paid);
	const isOverdue = $derived(!invoice.paid && new Date(invoice.due_date) < new Date());
</script>

<a
	href={resolve(`/invoices/${invoice.invoice_number}`)}
	class="block rounded-xl border p-3 transition-all hover:shadow-md
		{isPaid
		? 'bg-gradient-to-br from-success/5 to-transparent border-success/20'
		: isOverdue
			? 'bg-gradient-to-br from-error/5 to-transparent border-error/20'
			: 'bg-base-100 border-base-content/10'}"
>
	<div class="flex items-center gap-2.5">
		<!-- Status icon -->
		<div
			class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
				{isPaid ? 'bg-success/15' : isOverdue ? 'bg-error/15' : 'bg-base-content/5'}"
		>
			{#if isPaid}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-success"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else if isOverdue}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-error"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-4 h-4 text-base-content/30"
				>
					<path
						fill-rule="evenodd"
						d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
						clip-rule="evenodd"
					/>
				</svg>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center justify-between">
				<span class="font-mono text-xs font-semibold">INV-{invoice.invoice_number}</span>
				<span class="text-sm font-bold {isPaid ? 'text-success' : isOverdue ? 'text-error' : ''}"
					>{formatCurrency(invoice.total)}</span
				>
			</div>
			<div class="flex items-center justify-between mt-0.5">
				<span class="text-[11px] text-base-content/50 truncate mr-2">{invoice.customer_name}</span>
				<div class="flex items-center gap-1.5 shrink-0">
					{#if invoice.emailed}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-3 h-3 text-warning"
						>
							<title>Emailed</title>
							<path
								d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"
							/>
							<path
								d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"
							/>
						</svg>
					{/if}
					<span class="text-[11px] text-base-content/40">
						{new Date(invoice.due_date).toLocaleDateString('en-GB', {
							day: 'numeric',
							month: 'short'
						})}
					</span>
				</div>
			</div>
		</div>
	</div>
</a>
