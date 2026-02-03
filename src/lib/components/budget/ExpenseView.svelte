<script lang="ts">
	import { formatCurrency } from '$lib/helpers';
	import { getBudgetModalControls } from '$lib/context/budget.svelte';

	const modals = getBudgetModalControls();
	const { expense = $bindable() } = $props();
</script>

<button
	class="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-base-content/5 rounded-lg cursor-pointer"
	onclick={() => {
		modals.editExpense.show(expense.id, expense.description, expense.amount, expense.billspot);
	}}
>
	<div class="flex-1 min-w-0">
		<span class="text-sm">{expense.description}</span>
	</div>
	<div class="flex items-center gap-2 shrink-0">
		{#if expense.billspot}
			<div
				class="w-5 h-5 rounded-md bg-warning/15 flex items-center justify-center"
				title="Bills Pot"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M6.483 20q-.517 0-.964-.344t-.592-.839q-.625-2.215-.996-3.676q-.372-1.46-.58-2.469q-.209-1.009-.28-1.726T3 9.5q0-1.882 1.309-3.191Q5.619 5 7.5 5H13q.675-.9 1.588-1.45T16.5 3q.208 0 .354.147t.146.357q0 .05-.018.094t-.03.112q-.12.313-.236.723t-.243 1.138L19.402 8.5h.79q.344 0 .576.232t.232.576v3.846q0 .272-.149.481t-.416.296l-2.068.68l-1.269 4.233q-.162.527-.587.842q-.426.314-.973.314h-.923q-.666 0-1.14-.475T13 18.386V18H9v.385q0 .666-.475 1.14T7.385 20zM16 10.77q.31 0 .54-.23t.23-.54t-.23-.54t-.54-.23t-.54.23t-.23.54t.23.54t.54.23M12.5 8.5q.213 0 .356-.144T13 7.999t-.144-.356T12.5 7.5h-4q-.213 0-.356.144T8 8.001t.144.356t.356.143z"
					/>
				</svg>
			</div>
		{/if}
		<span class="text-sm font-semibold text-base-content/70">{formatCurrency(expense.amount)}</span>
	</div>
</button>
