<script lang="ts">
	import { create_expense } from '$lib/funcs/budget.remote';

	let showModal = $state(false);

	let category_id = $state('');

	export function show(cat_id: string) {
		category_id = cat_id;
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Item</h3>
		<form {...create_expense} onsubmit={() => (showModal = false)}>
			<input
				{...create_expense.fields.category_id.as('text')}
				type="hidden"
				bind:value={category_id}
			/>
			<div class="form-control mt-4">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<input
					{...create_expense.fields.description.as('text')}
					placeholder="e.g. Netflix"
					class="input input-bordered input-sm"
				/>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="amount">
					<span class="label-text">Amount</span>
				</label>
				<input
					{...create_expense.fields.amount.as('number')}
					placeholder="0"
					class="input input-bordered input-sm"
				/>
			</div>
			<div class="form-control mt-4">
				<label class="label cursor-pointer justify-start gap-3">
					<input {...create_expense.fields.billspot.as('checkbox')} />
					<span class="label-text">Bills Pot</span>
				</label>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" type="button" onclick={() => (showModal = false)}
					>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
