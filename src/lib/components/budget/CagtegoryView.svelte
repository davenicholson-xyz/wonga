<script lang="ts">
	import { getBudgetModalControls } from '$lib/context/budget.svelte';
	import ExpenseView from '$lib/components/budget/ExpenseView.svelte';
	import { formatCurrency } from '$lib/helpers';

	const modals = getBudgetModalControls();
	const { category = $bindable() } = $props();
</script>

<div class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden mt-2">
	<!-- Category header -->
	<div class="flex items-center justify-between px-3 py-1.5 border-b border-base-content/5">
		<button
			class="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
			onclick={() =>
				modals.editCategory.show(
					category.id,
					category.name,
					category.emoji,
					category.expenses.length > 0
				)}
		>
			{#if category.emoji}
				<span class="text-sm">{category.emoji}</span>
			{/if}
			<span class="font-bold text-xs">{category.name}</span>
		</button>
		<span class="text-xs font-bold">{formatCurrency(category.total)}</span>
	</div>

	<!-- Expenses -->
	<div>
		{#each category.expenses as expense (expense.id)}
			<ExpenseView {expense} />
		{/each}
	</div>

	<!-- Add item -->
	<div class="border-t border-base-content/5 px-3 py-1">
		<button
			class="btn btn-ghost btn-xs w-full text-base-content/30"
			onclick={() => {
				modals.newExpense.show(category.id);
			}}>+ Add Item</button
		>
	</div>
</div>
