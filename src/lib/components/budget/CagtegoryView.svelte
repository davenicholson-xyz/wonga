<script lang="ts">
	import { getBudgetModalControls } from '$lib/context/budget.svelte';
	import ExpenseView from '$lib/components/budget/ExpenseView.svelte';
	import { formatCurrency } from '$lib/helpers';

	const modals = getBudgetModalControls();
	const { category = $bindable() } = $props();
</script>

<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden mt-3">
	<!-- Category header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-base-content/5">
		<button
			class="flex items-center gap-2 hover:opacity-70 transition-opacity"
			onclick={() =>
				modals.editCategory.show(
					category.id,
					category.name,
					category.emoji,
					category.expenses.length > 0
				)}
		>
			{#if category.emoji}
				<div class="w-7 h-7 rounded-lg bg-base-content/5 flex items-center justify-center text-sm">
					{category.emoji}
				</div>
			{/if}
			<span class="font-bold text-sm">{category.name}</span>
		</button>
		<span class="text-sm font-bold">{formatCurrency(category.total)}</span>
	</div>

	<!-- Expenses -->
	<div class="py-1">
		{#each category.expenses as expense (expense.id)}
			<ExpenseView {expense} />
		{/each}
	</div>

	<!-- Add item -->
	<div class="border-t border-base-content/5 px-3 py-2">
		<button
			class="btn btn-ghost btn-xs w-full text-base-content/30"
			onclick={() => {
				modals.newExpense.show(category.id);
			}}>+ Add Item</button
		>
	</div>
</div>
