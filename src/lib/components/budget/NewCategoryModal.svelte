<script lang="ts">
	import { create_category } from '$lib/funcs/budget.remote';

	let showModal = $state(false);

	export function show() {
		showModal = true;
	}
</script>

<dialog class="modal" class:modal-open={showModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Category</h3>
		<form {...create_category} onsubmit={() => (showModal = false)}>
			<div class="form-control mt-4">
				<label class="label" for="categoryName">
					<span class="label-text">Name</span>
				</label>
				<input
					{...create_category.fields.name.as('text')}
					id="categoryName"
					class="input input-bordered input-sm"
				/>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost btn-sm"
					onclick={(e: Event) => {
						e.preventDefault();
						showModal = false;
					}}>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showModal = false)}>close</button>
	</form>
</dialog>
