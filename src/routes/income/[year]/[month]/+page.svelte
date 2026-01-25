<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import { get_invoice_for_month } from '$lib/funcs/income.remote';

	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	const year = $derived(page.params.year) as string;
	const month = $derived(page.params.month) as string;

	const month_name = $derived(
		new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-GB', {
			month: 'long'
		})
	);

	const current_month_year = $derived({ month: parseInt(month), year: parseInt(year) });

	let tax_percent = $state<number>(25);

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			maximumFractionDigits: 0
		}).format(amount);

	const next_month = $derived(current_month_year.month === 12 ? 1 : current_month_year.month + 1);
	const next_year = $derived(
		current_month_year.month === 12 ? current_month_year.year + 1 : current_month_year.year
	);

	const previous_month = $derived(
		current_month_year.month === 1 ? 12 : current_month_year.month - 1
	);
	const previous_year = $derived(
		current_month_year.month === 1 ? current_month_year.year - 1 : current_month_year.year
	);
</script>

<div class="flex justify-between align-center mb-8 mx-6">
	<a href={resolve(`/income/${previous_year}/${previous_month}`)} aria-label="Previous Month">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
		</svg>
	</a>

	<h3 class="text-2xl font-bold">{month_name} {year}</h3>

	<a href={resolve(`/income/${next_year}/${next_month}`)} aria-label="Next Month">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-6 h-6"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
		</svg>
	</a>
</div>

{#snippet incomecard(invoice)}
	<div class="card bg-base-100 shadow-sm mb-3 mx-8">
		<div class="card-body p-4 flex-row items-center justify-between">
			<div>
				<h3 class="card-title text-base">INV-{invoice.invoice_number}</h3>
				<p class="text-sm opacity-70">
					Due: {new Date(invoice.due_date).toLocaleDateString('en-GB')}
				</p>
			</div>
			<div class="flex items-center gap-3">
				{#if invoice.paid}
					<span class="badge badge-success">Paid</span>
				{:else}
					<span class="badge badge-warning">Unpaid</span>
				{/if}
				<span class="text-lg font-bold">{formatCurrency(invoice.total)}</span>
			</div>
		</div>
	</div>
{/snippet}

{#await get_invoice_for_month(current_month_year)}
	<span class="loading loading-spinner loading-lg"></span>
{:then invoices}
	{@const month_gross = invoices.reduce((acc, invoice) => acc + invoice.total, 0)}
	{@const month_net = month_gross * (1 - tax_percent / 100)}
	{@const month_tax = month_gross - month_net}

	<div class="card bg-base-200 shadow-sm mb-4 mx-8">
		<div class="card-body p-4 flex-row justify-between">
			<div class="text-center">
				<div class="text-sm opacity-70">Gross</div>
				<div class="text-2xl font-bold">{formatCurrency(month_gross)}</div>
			</div>
			<div class="text-center">
				<div class="text-sm opacity-70">Tax ({tax_percent}%)</div>
				<div class="text-lg font-bold text-error mb-3">{formatCurrency(month_tax)}</div>
				<input
					type="range"
					class="range range-xs w-full"
					min="0"
					max="50"
					step="5"
					bind:value={tax_percent}
				/>
			</div>
			<div class="text-center">
				<div class="text-sm opacity-70">Net</div>
				<div class="text-2xl font-bold text-success">{formatCurrency(month_net)}</div>
			</div>
		</div>
	</div>

	{#each invoices as invoice (invoice.id)}
		{@render incomecard(invoice)}
	{/each}
{/await}
