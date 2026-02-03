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
			<div class="grid grid-cols-3 gap-2 mb-3">
				<div
					class="rounded-xl bg-gradient-to-br from-info/10 to-info/5 border border-info/20 p-2.5"
				>
					<div class="flex items-center gap-1.5 mb-1">
						<div class="w-6 h-6 rounded-md bg-info/20 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-3.5 h-3.5 text-info"
							>
								<path
									fill-rule="evenodd"
									d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 1a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 15.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5ZM2 17.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span class="text-[10px] font-medium text-base-content/50">Gross</span>
					</div>
					<div class="text-lg font-bold">{formatCurrency(inc.total)}</div>
				</div>
				<button
					class="rounded-xl bg-gradient-to-br from-error/10 to-error/5 border border-error/20 p-2.5 text-left"
					onclick={() => openTaxModal(group.year, group.month, inc.tax_percent, income)}
				>
					<div class="flex items-center gap-1.5 mb-1">
						<div class="w-6 h-6 rounded-md bg-error/20 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-3.5 h-3.5 text-error"
							>
								<path
									fill-rule="evenodd"
									d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 1.06 0l3.046 3.046a20.902 20.902 0 0 1 5.441-5.185l-2.829-.757a.75.75 0 0 1-.53-.919Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span class="text-[10px] font-medium text-base-content/50">Tax {inc.tax_percent}%</span>
					</div>
					<div class="text-lg font-bold text-error">{formatCurrency(inc.total - inc.net)}</div>
				</button>
				<div
					class="rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 p-2.5"
				>
					<div class="flex items-center gap-1.5 mb-1">
						<div class="w-6 h-6 rounded-md bg-success/20 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-3.5 h-3.5 text-success"
							>
								<path
									d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603c-.348.07-.66.2-.918.39-.26.19-.462.44-.528.72a.67.67 0 0 0 .056.543Z"
								/>
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.19 2.19 0 0 0-.736-.363V9.3c.514.1.98.27 1.388.492.582.315 1.012.754 1.232 1.292.22.539.199 1.1-.052 1.592-.249.49-.726.9-1.381 1.167-.213.087-.44.155-.677.203v.316a.75.75 0 0 1-1.5 0v-.316a3.78 3.78 0 0 1-1.653-.713 3.08 3.08 0 0 1-.925-1.2.75.75 0 0 1 1.395-.55c.12.303.292.508.447.563.225.08.469.135.736.363V8.7a5.38 5.38 0 0 1-1.388-.492C6.852 7.893 6.422 7.454 6.202 6.916a2.35 2.35 0 0 1 .052-1.592c.249-.49.726-.9 1.381-1.167.213-.087.44-.155.677-.203V4.75A.75.75 0 0 1 10 4Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span class="text-[10px] font-medium text-base-content/50">Net</span>
					</div>
					<div class="text-lg font-bold text-success">{formatCurrency(inc.net)}</div>
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
				<span class="label-text">Tax Percentage: {modal_tax}%</span>
			</label>
			<input
				id="tax-input"
				type="range"
				class="range range-sm"
				min="0"
				max="50"
				bind:value={modal_tax}
			/>
			<div class="flex justify-between text-xs opacity-60 px-1 mt-1">
				<span>0%</span>
				<span>25%</span>
				<span>50%</span>
			</div>
		</div>
		<div class="modal-action">
			<button class="btn btn-sm" onclick={() => (modal_open = false)}>Cancel</button>
			<button class="btn btn-primary btn-sm" onclick={saveTax}>Save</button>
		</div>
	</div>
	<div class="modal-backdrop" onclick={() => (modal_open = false)}></div>
</div>
