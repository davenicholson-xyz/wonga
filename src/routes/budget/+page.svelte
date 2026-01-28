<script lang="ts">
	import BudgetStats from '$lib/components/budget/BudgetStats.svelte';
	import { get_categories_with_expenses } from '$lib/funcs/budget.remote';
	import { get_income_for } from '$lib/funcs/income.remote';
	import CagtegoryView from '$lib/components/budget/CagtegoryView.svelte';
	import NewCategoryModal from '$lib/components/budget/NewCategoryModal.svelte';
	import EditCategoryModal from '$lib/components/budget/EditCategoryModal.svelte';

	import { setModalControls } from '$lib/context/modals.svelte';

	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	const income_data = get_income_for({ month: this_month, year: this_year });
	const net = $derived(income_data.current?.net ?? 0);

	const categories_data = get_categories_with_expenses();
	const categories = $derived(categories_data.current?.categories ?? []);
	const total = $derived(categories_data.current?.total ?? 0);
	const outgoing = $derived(total);

	let newCategoryModal: ReturnType<typeof NewCategoryModal>;
	let editCategoryModal: ReturnType<typeof EditCategoryModal>;

	setModalControls({
		newCategory: { show: () => newCategoryModal.showModal() },
		editCategory: {
			show: (id: string, name: string, expenses: boolean) =>
				editCategoryModal.show(id, name, expenses)
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

	// let newCategoryModal: ReturnType<typeof NewCategoryModal>;
	// let editCategoryModal: ReturnType<typeof EditCategoryModal>;

	// function showEditCategoryModalHandler(id: string, name: string) {
	// 	editCategoryID = id;
	// 	editCategoryName = name;
	// 	showEditCategoryModal = true;
	// }

	// let showEditCategoryModal = $state(true);
	// let editCategoryID = $state('');
	// let editCategoryName = $state('');

	// let showNewItemModal = $state(false);
	// let newItemCategoryId = $state('');
	// function showNewItemModalHandler(category_id: string) {
	// 	newItemCategoryId = category_id;
	// 	showNewItemModal = true;
	// }

	// const editCategoryHasExpenses = $derived(
	// 	categories.find((c) => c.id === editCategoryID)?.expenses.length ?? 0 > 0
	// );

	// async function delete_category_handler(id: string) {
	// 	const category = categories.find((c) => c.id === id);
	// 	if (category && category.expenses.length > 0) {
	// 		alert('Cannot delete a category that has expenses. Remove the expenses first.');
	// 		return;
	// 	}
	// 	if (confirm('Are you sure you want to delete this category?')) {
	// 		await delete_category({ id });
	// 		showEditCategoryModal = false;
	// 	}
	// }

	// let showEditItemModal = $state(false);
	// let editItemID = $state('');
	// let editItemDescription = $state('');
	// let editItemAmount = $state(0);
	// let editItemBillsPot = $state<boolean | null>(null);
	// function showEditItemModalHandler(
	// 	id: string,
	// 	description: string,
	// 	amount: number,
	// 	billspot: boolean | null
	// ) {
	// 	editItemID = id;
	// 	editItemDescription = description;
	// 	editItemAmount = amount;
	// 	editItemBillsPot = billspot;
	// 	showEditItemModal = true;
	// }
</script>

<div class="mx-4 mt-2">
	<BudgetStats {net} {outgoing} {bills_pot} />

	{#each categories as category (category.id)}
		<CagtegoryView {category} />
		<!-- <CagtegoryView {category} edit={() => editCategoryModal.show(category.id, category.name)} /> -->
	{/each}

	<button
		class="btn btn-ghost btn-sm w-full mt-2 opacity-50"
		onclick={() => newCategoryModal.showModal()}>+ Add Category</button
	>
</div>

<NewCategoryModal bind:this={newCategoryModal} />
<EditCategoryModal bind:this={editCategoryModal} />
