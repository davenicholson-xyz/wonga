<script lang="ts">
	import BudgetStats from '$lib/components/budget/BudgetStats.svelte';
	import CagtegoryView from '$lib/components/budget/CagtegoryView.svelte';
	import NewCategoryModal from '$lib/components/budget/NewCategoryModal.svelte';
	import NewExpenseModal from '$lib/components/budget/NewExpenseModal.svelte';
	import EditCategoryModal from '$lib/components/budget/EditCategoryModal.svelte';
	import EditExpenseModal from '$lib/components/budget/EditExpenseModal.svelte';

	import { get_categories_with_expenses } from '$lib/funcs/budget.remote';
	import { get_income_for, get_income_months } from '$lib/funcs/income.remote';

	import { setBudgetModalControls } from '$lib/context/budget.svelte';

	const now = new Date();
	const default_month = now.getMonth() + 1;
	const default_year = now.getFullYear();

	let selected_month = $state(default_month);
	let selected_year = $state(default_year);

	const income_data = $derived(get_income_for({ month: selected_month, year: selected_year }));
	const income_months_data = get_income_months();
	const available_months = $derived(income_months_data.current ?? []);

	const net = $derived(income_data.current?.net ?? 0);

	const categories_data = get_categories_with_expenses();
	const categories = $derived(categories_data.current?.categories ?? []);
	const total = $derived(categories_data.current?.total ?? 0);
	const outgoing = $derived(total);

	let newCategoryModal: ReturnType<typeof NewCategoryModal>;
	let editCategoryModal: ReturnType<typeof EditCategoryModal>;
	let newExpenseModal: ReturnType<typeof NewExpenseModal>;
	let editExpenseModal: ReturnType<typeof EditExpenseModal>;

	setBudgetModalControls({
		newCategory: { show: () => newCategoryModal.show() },
		editCategory: {
			show: (id: string, name: string, emoji: string | null, expenses: boolean) =>
				editCategoryModal.show(id, name, emoji, expenses)
		},
		newExpense: { show: (category_id: string) => newExpenseModal.show(category_id) },
		editExpense: {
			show: (id: string, description: string, amount: number, bills_pot: boolean) =>
				editExpenseModal.show(id, description, amount, bills_pot)
		}
	});

	const bills_pot = $derived(
		categories.reduce((acc, category) => {
			return (
				acc +
				category.expenses.reduce((acc, expense) => {
					return acc + (expense.billspot ? expense.amount : 0);
				}, 0)
			);
		}, 0)
	);
</script>

<div class="mx-4 mt-2">
	<BudgetStats
		{net}
		{outgoing}
		{bills_pot}
		{selected_month}
		{selected_year}
		{default_month}
		{default_year}
		{available_months}
		on_month_change={(m, y) => {
			selected_month = m;
			selected_year = y;
		}}
	/>

	{#each categories as category (category.id)}
		<CagtegoryView {category} />
	{/each}

	<button
		class="w-full mt-3 rounded-xl border border-dashed border-base-content/15 p-3 text-sm text-base-content/30 hover:border-base-content/30 hover:text-base-content/50 transition-colors"
		onclick={() => newCategoryModal.show()}>+ Add Category</button
	>
</div>

<NewCategoryModal bind:this={newCategoryModal} />
<EditCategoryModal bind:this={editCategoryModal} />
<NewExpenseModal bind:this={newExpenseModal} />
<EditExpenseModal bind:this={editExpenseModal} />
