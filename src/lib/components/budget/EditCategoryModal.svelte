<script lang="ts">
	import { update_category } from '$lib/funcs/budget.remote';

	let showModal = $state(false);

	let id = $state('');
	let name = $state('');
	let expenses = $state(false);

	export function show(category_id: string, category_name: string, category_expenses: boolean) {
		id = category_id;
		name = category_name;
		expenses = category_expenses;
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Category</h3>
		<form {...update_category} onsubmit={() => (showModal = false)}>
			<input {...update_category.fields.id.as('text')} type="hidden" bind:value={id} />
			<div class="form-control mt-4">
				<label class="label" for="category-name">
					<span class="label-text">Name</span>
				</label>
				<input
					{...update_category.fields.name.as('text')}
					bind:value={name}
					class="input input-bordered input-sm"
					id="category-name"
				/>
			</div>
			<div class="modal-action justify-between">
				<div class="flex gap-2">
					<button
						class="btn btn-error btn-sm"
						disabled={expenses}
						title={expenses ? 'Remove all expenses first' : ''}
						onclick={() => {}}>Delete</button
					>

					<button
						class="btn btn-ghost btn-sm"
						onclick={(e: Event) => {
							e.preventDefault();
							showModal = false;
						}}>Cancel</button
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
