<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import { get_invoice_for_month } from '$lib/funcs/income.remote';
	import IncomeCard from '$lib/components/IncomeCard.svelte';

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

<a href={resolve(`/income/${previous_year}/${previous_month}`)}>Previous Month</a>
<h3>{month_name} {year}</h3>
<a href={resolve(`/income/${next_year}/${next_month}`)}>Next Month</a>
<a href={resolve(`/income/${this_year}/${this_month}`)}>This Month</a>

<div>
	tax: <input type="number" min="0" bind:value={tax_percent} />
</div>

{#await get_invoice_for_month(current_month_year)}
	<p>Loading...</p>
{:then invoices}
	{@const month_gross = invoices.reduce((acc, invoice) => acc + invoice.total, 0)}
	{@const month_net = month_gross * (1 - tax_percent / 100)}
	{@const month_tax = month_gross - month_net}

	<div>
		<p>Gross: {formatCurrency(month_gross)}</p>
		<p>Tax: {formatCurrency(month_tax)}</p>
		<p>Net: {formatCurrency(month_net)}</p>
	</div>

	{#each invoices as invoice (invoice.id)}
		<IncomeCard {invoice} />
	{/each}
{/await}
