<script lang="ts">
	import { getModalControls } from '$lib/context/modals.svelte';
	import ExpenseView from '$lib/components/budget/ExpenseView.svelte';
	import { formatCurrency } from '$lib/helpers';

	const modals = getModalControls();
	const { category = $bindable() } = $props();
	$inspect(category);
</script>

<div class="card bg-base-100 shadow-sm mt-2">
	<div class="card-body p-3">
		<div class="flex justify-between items-center">
			<button
				class="font-bold text-sm hover:underline text-left"
				onclick={() =>
					modals.editCategory.show(category.id, category.name, category.expenses.length > 0)}
			>
				{category.name}
			</button>
			<span class="text-sm font-bold">{formatCurrency(category.total)}</span>
		</div>
		<table class="table table-xs">
			<tbody>
				{#each category.expenses as expense (expense.id)}
					<ExpenseView {expense} />
				{/each}
			</tbody>
		</table>
	</div>
</div>
