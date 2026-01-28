<script lang="ts">
	import BudgetStats from '$lib/components/budget/BudgetStats.svelte';
	import CagtegoryView from '$lib/components/budget/CagtegoryView.svelte';
	import NewCategoryModal from '$lib/components/budget/NewCategoryModal.svelte';
	import NewExpenseModal from '$lib/components/budget/NewExpenseModal.svelte';
	import EditCategoryModal from '$lib/components/budget/EditCategoryModal.svelte';
	import EditExpenseModal from '$lib/components/budget/EditExpenseModal.svelte';

	import { get_categories_with_expenses } from '$lib/funcs/budget.remote';
	import { get_income_for } from '$lib/funcs/income.remote';

	import { setBudgetModalControls } from '$lib/context/modals.svelte';

	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	const income_data = get_income_for({ month: this_month, year: this_year });

	const net = 4000;
	//const net = $derived(income_data.current?.net ?? 0);

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
			show: (id: string, name: string, expenses: boolean) =>
				editCategoryModal.show(id, name, expenses)
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
	<BudgetStats {net} {outgoing} {bills_pot} />

	{#each categories as category (category.id)}
		<CagtegoryView {category} />
	{/each}

	<button
		class="btn btn-ghost btn-sm w-full mt-2 opacity-50"
		onclick={() => newCategoryModal.show()}>+ Add Category</button
	>
</div>

<NewCategoryModal bind:this={newCategoryModal} />
<EditCategoryModal bind:this={editCategoryModal} />
<NewExpenseModal bind:this={newExpenseModal} />
<EditExpenseModal bind:this={editExpenseModal} />
