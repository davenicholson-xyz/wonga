<script>
	import { resolve } from '$app/paths';
	import InvoiceCard from '$lib/components/invoice/InvoiceCard.svelte';
	import { get_invoices } from '$lib/funcs/invoices.remote';
	import { get_income_for } from '$lib/funcs/income.remote';
	import { set_settings } from '$lib/funcs/settings.remote';
	import { formatCurrency } from '$lib/helpers';
	import { SvelteMap } from 'svelte/reactivity';

	const data = get_invoices();
	const invoices = $derived(data.current ?? []);

	const grouped = $derived.by(() => {
		const groups = new SvelteMap();
		for (const inv of invoices) {
			const d = new Date(inv.due_date);
			const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
			if (!groups.has(key)) {
				groups.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, invoices: [] });
			}
			groups.get(key).invoices.push(inv);
		}
		return [...groups.values()].sort((a, b) =>
			b.year !== a.year ? b.year - a.year : b.month - a.month
		);
	});

	const monthName = (month, year) =>
		new Date(year, month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

	let modal_open = $state(false);
	let modal_year = $state(0);
	let modal_month = $state(0);
	let modal_tax = $state(20);
	let modal_income = $state(null);

	function openTaxModal(year, month, tax_percent, income) {
		modal_year = year;
		modal_month = month;
		modal_tax = tax_percent;
		modal_income = income;
		modal_open = true;
	}

	async function saveTax() {
		const key = `tax_percent_${modal_year}_${modal_month}`;
		await set_settings({ key, value: modal_tax.toString() });
		modal_income.refresh();
		modal_open = false;
	}
</script>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Invoices</h1>
	<a href={resolve('/invoices/new')} class="btn btn-primary btn-sm">New Invoice</a>
</div>

{#each grouped as group (group.year + '-' + group.month)}
	{@const income = get_income_for({ month: group.month, year: group.year })}
	{@const inc = income.current}

	<div class="mb-6">
		<h2 class="text-sm font-semibold mb-2 opacity-60">{monthName(group.month, group.year)}</h2>

		{#if inc}
			<div class="card bg-base-200 shadow-sm mb-2">
				<div class="card-body p-3 flex-row justify-between text-center">
					<div>
						<div class="text-xs opacity-70">Gross</div>
						<div class="text-lg font-bold">{formatCurrency(inc.total)}</div>
					</div>
					<div>
						<button
							class="text-xs opacity-70 underline decoration-dotted cursor-pointer"
							onclick={() => openTaxModal(group.year, group.month, inc.tax_percent, income)}
						>
							Tax ({inc.tax_percent}%)
						</button>
						<div class="text-lg font-bold text-error">{formatCurrency(inc.total - inc.net)}</div>
					</div>
					<div>
						<div class="text-xs opacity-70">Net</div>
						<div class="text-lg font-bold text-success">{formatCurrency(inc.net)}</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			{#each group.invoices as invoice (invoice.id)}
				<InvoiceCard {invoice} />
			{/each}
		</div>
	</div>
{/each}

<div class="modal" class:modal-open={modal_open}>
	<div class="modal-box">
		<h3 class="text-lg font-bold mb-4">
			Adjust Tax - {monthName(modal_month, modal_year)}
		</h3>
		<div class="form-control">
			<label class="label" for="tax-input">
				<span class="label-text">Tax Percentage</span>
			</label>
			<input
				id="tax-input"
				type="number"
				class="input input-bordered input-sm w-full"
				min="0"
				max="100"
				bind:value={modal_tax}
			/>
		</div>
		<div class="modal-action">
			<button class="btn btn-sm" onclick={() => (modal_open = false)}>Cancel</button>
			<button class="btn btn-primary btn-sm" onclick={saveTax}>Save</button>
		</div>
	</div>
	<div class="modal-backdrop" onclick={() => (modal_open = false)}></div>
</div>
