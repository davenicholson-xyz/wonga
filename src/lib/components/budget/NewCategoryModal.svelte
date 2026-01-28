<script lang="ts">
	import { create_category } from '$lib/funcs/budget.remote';

	let show = $state(false);

	export function showModal() {
		show = true;
	}
</script>

<dialog class="modal" class:modal-open={show}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Category</h3>
		<form {...create_category} onsubmit={() => (show = false)}>
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
						show = false;
					}}>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (show = false)}>close</button>
	</form>
</dialog>
