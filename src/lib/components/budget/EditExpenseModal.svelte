<script lang="ts">
	import { update_expense, delete_expense } from '$lib/funcs/budget.remote';

	let showModal = $state(false);

	let id = $state('');
	let description = $state('');
	let amount = $state(0);
	let billspot = $state(false);

	export function show(
		expense_id: string,
		expense_description: string,
		expense_amount: number,
		expense_billspot: boolean
	) {
		id = expense_id;
		description = expense_description;
		amount = expense_amount;
		billspot = expense_billspot;
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Item</h3>
		<form {...update_expense} onsubmit={() => (showModal = false)}>
			<input {...update_expense.fields.id.as('text')} type="hidden" bind:value={id} />
			<div class="form-control mt-4">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<input
					{...update_expense.fields.description.as('text')}
					class="input input-bordered input-sm"
					bind:value={description}
				/>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="amount">
					<span class="label-text">Amount</span>
				</label>
				<input
					{...update_expense.fields.amount.as('number')}
					class="input input-bordered input-sm"
					bind:value={amount}
				/>
			</div>
			<div class="form-control mt-4">
				<label class="label cursor-pointer justify-start gap-3">
					<input
						{...update_expense.fields.billspot.as('checkbox')}
						checked={billspot}
						class="toggle"
					/>
					<span class="label-text">Bills Pot</span>
				</label>
			</div>
			<div class="modal-action justify-between">
				<button
					type="button"
					class="btn btn-error btn-sm"
					onclick={async () => {
						await delete_expense({ id });
						showModal = false;
					}}>Delete</button
				>
				<div class="flex gap-2">
					<button type="button" class="btn btn-ghost btn-sm" onclick={() => (showModal = false)}
						>Cancel</button
					>
					<button class="btn btn-primary btn-sm" type="submit">Save</button>
				</div>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
