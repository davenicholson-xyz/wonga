<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { formatCurrency } from '$lib/helpers';
	import { get_invoice, mark_paid } from '$lib/funcs/invoices.remote';

	const { number } = page.params as { number: string };

	const data = get_invoice(parseInt(number));
	const inv = $derived(data.current);

	type InvoiceItem = {
		name: string;
		description: string;
		price: number;
		quantity: number;
	};

	const items = $derived<InvoiceItem[]>(inv ? JSON.parse(inv.items) : []);
</script>

{#if inv}
	<div class="max-w-3xl mx-auto space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<a href={resolve('/invoices')} class="btn btn-ghost btn-sm">← Back</a>
				<h1 class="text-lg font-bold">INV-{inv.invoice_number}</h1>
				{#if inv.paid}
					<span class="badge badge-success badge-sm">Paid</span>
				{:else}
					<span class="badge badge-warning badge-sm">Unpaid</span>
				{/if}
			</div>
			{#if !inv.paid}
				<button class="btn btn-primary btn-sm" onclick={() => mark_paid(inv.id)}>
					Mark as Paid
				</button>
			{/if}
		</div>

		<!-- Invoice document -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-6 pt-5 text-sm">
				<!-- Top section: Invoice info + Customer -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<div>
						<div class="space-y-0.5 text-base-content/70">
							<p>
								<span class="font-medium text-base-content">Number:</span> INV-{inv.invoice_number}
							</p>
							<p>
								<span class="font-medium text-base-content">Date:</span>
								{new Date(inv.invoice_date).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</p>
							<p>
								<span class="font-medium text-base-content">Due:</span>
								{new Date(inv.due_date).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
							</p>
						</div>
					</div>
					<div class="sm:text-right">
						<h2 class="text-sm font-bold mb-1 text-base-content/50 uppercase tracking-wide">
							Bill To
						</h2>
						<div class="space-y-0.5 text-base-content/70">
							<p class="font-medium text-base-content">{inv.customer_name}</p>
							{#if inv.customer_address}
								{#each inv.customer_address.split('\n') as line (line)}
									<p>{line}</p>
								{/each}
							{/if}
							{#if inv.customer_email}
								<p>{inv.customer_email}</p>
							{/if}
						</div>
					</div>
				</div>

				<div class="divider my-3"></div>

				<!-- Items table -->
				<table class="table table-xs">
					<thead>
						<tr class="text-base-content/50 uppercase tracking-wide text-xs">
							<th>Item</th>
							<th class="text-right">Qty</th>
							<th class="text-right">Price</th>
							<th class="text-right">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							<tr>
								<td>
									<div class="font-medium">{item.name}</div>
									{#if item.description}
										<div class="text-xs text-base-content/60">{item.description}</div>
									{/if}
								</td>
								<td class="text-right">{item.quantity}</td>
								<td class="text-right">{formatCurrency(item.price)}</td>
								<td class="text-right">{formatCurrency(item.price * item.quantity)}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<div class="divider my-2"></div>

				<!-- Total -->
				<div class="flex justify-end">
					<div class="text-right">
						<div class="text-xs text-base-content/50 uppercase tracking-wide">Total</div>
						<div class="text-lg font-bold">{formatCurrency(inv.total)}</div>
					</div>
				</div>
			</div>
		</div>

		<a href={resolve(`/invoices/${number}/pdf`)} class="btn btn-primary btn-sm w-full">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024">
				<path
					fill="currentColor"
					d="m531.3 574.4l.3-1.4c5.8-23.9 13.1-53.7 7.4-80.7c-3.8-21.3-19.5-29.6-32.9-30.2c-15.8-.7-29.9 8.3-33.4 21.4c-6.6 24-.7 56.8 10.1 98.6c-13.6 32.4-35.3 79.5-51.2 107.5c-29.6 15.3-69.3 38.9-75.2 68.7c-1.2 5.5.2 12.5 3.5 18.8c3.7 7 9.6 12.4 16.5 15c3 1.1 6.6 2 10.8 2c17.6 0 46.1-14.2 84.1-79.4c5.8-1.9 11.8-3.9 17.6-5.9c27.2-9.2 55.4-18.8 80.9-23.1c28.2 15.1 60.3 24.8 82.1 24.8c21.6 0 30.1-12.8 33.3-20.5c5.6-13.5 2.9-30.5-6.2-39.6c-13.2-13-45.3-16.4-95.3-10.2c-24.6-15-40.7-35.4-52.4-65.8M421.6 726.3c-13.9 20.2-24.4 30.3-30.1 34.7c6.7-12.3 19.8-25.3 30.1-34.7m87.6-235.5c5.2 8.9 4.5 35.8.5 49.4c-4.9-19.9-5.6-48.1-2.7-51.4c.8.1 1.5.7 2.2 2m-1.6 120.5c10.7 18.5 24.2 34.4 39.1 46.2c-21.6 4.9-41.3 13-58.9 20.2c-4.2 1.7-8.3 3.4-12.3 5c13.3-24.1 24.4-51.4 32.1-71.4m155.6 65.5c.1.2.2.5-.4.9h-.2l-.2.3c-.8.5-9 5.3-44.3-8.6c40.6-1.9 45 7.3 45.1 7.4m191.4-388.2L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7M790.2 326H602V137.8zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216z"
				/>
			</svg>
			Generate PDF
		</a>
	</div>
{/if}
