<script lang="ts">
	import {
		create_category,
		get_categories_with_expenses,
		update_category
	} from '$lib/funcs/budget.remote';
	import { get_income_for } from '$lib/funcs/income.remote';

	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	const { total: income } = await get_income_for({ month: this_month, year: this_year });

	const categories_data = get_categories_with_expenses();
	const categories = $derived(categories_data.current?.categories ?? []);
	const total = $derived(categories_data.current?.total ?? 0);

	// Placeholder values - to be calculated later
	const outgoing = $derived(total);
	const bills_pot = 800;

	const remaining = income - outgoing;

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			maximumFractionDigits: 0
		}).format(amount);

	let expanded = $state(false);

	let showCategoryModal = $state(false);
	function showEditCategoryModalHandler(id: string, name: string) {
		editCategoryID = id;
		editCategoryName = name;
		showEditCategoryModal = true;
	}

	let showEditCategoryModal = $state(false);
	let editCategoryID = $state('');
	let editCategoryName = $state('');

	let showNewItemModal = $state(false);
	let newItemName = $state('');
	let newItemAmount = $state(0);
	let newItemBillsPot = $state(false);

	let showEditItemModal = $state(false);
	let editItemID = $state('');
	let editItemName = $state('');
	let editItemAmount = $state(0);
	let editItemBillsPot = $state(false);
</script>

<div class="mx-4 mt-2">
	<div
		class="card bg-base-200 shadow-sm cursor-pointer"
		onclick={() => (expanded = !expanded)}
		onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
		role="button"
		tabindex="0"
	>
		<div class="card-body p-3">
			<div class="flex justify-between">
				<div class="text-center">
					<div class="text-xs opacity-70">Income</div>
					<div class="text-xl font-bold">{formatCurrency(income)}</div>
				</div>
				<div class="text-center">
					<div class="text-xs opacity-70">Remaining</div>
					<div
						class="text-xl font-bold"
						class:text-success={remaining >= 0}
						class:text-error={remaining < 0}
					>
						{formatCurrency(remaining)}
					</div>
				</div>
			</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-3 h-3 mx-auto mt-1 opacity-50 transition-transform"
				class:rotate-180={expanded}
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
			</svg>

			{#if expanded}
				<div class="divider my-1"></div>
				<div class="flex justify-around">
					<div class="text-center">
						<div class="text-xs opacity-70">Outgoing</div>
						<div class="font-bold text-error">{formatCurrency(outgoing)}</div>
					</div>
					<div class="text-center">
						<div class="text-xs opacity-70">Bills Pot</div>
						<div class="font-bold">{formatCurrency(bills_pot)}</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#each categories as category (category.id)}
		<div class="card bg-base-100 shadow-sm mt-2">
			<div class="card-body p-3">
				<div class="flex justify-between items-center">
					<button
						class="font-bold text-sm hover:underline text-left"
						onclick={() => {
							showEditCategoryModalHandler(category.id, category.name);
						}}
					>
						{category.name}
					</button>
					<span class="text-sm font-bold">{formatCurrency(category.total)}</span>
				</div>
				<table class="table table-xs">
					<tbody>
						{#each category.expenses as expense (expense.id)}
							<tr
								class="cursor-pointer hover"
								onclick={() => {
									editItemName = 'Rent';
									editItemAmount = 850;
									editItemBillsPot = true;
									showEditItemModal = true;
								}}
							>
								<td>{expense.description}</td>
								<td class="text-right">{formatCurrency(expense.amount)}</td>
								<td class="w-8 text-center text-yellow-400 opacity-60">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="12"
										height="12"
										viewBox="0 0 24 24"
									>
										<g
											fill="none"
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										>
											<path
												d="M9.5 3h5A1.5 1.5 0 0 1 16 4.5A3.5 3.5 0 0 1 12.5 8h-1A3.5 3.5 0 0 1 8 4.5A1.5 1.5 0 0 1 9.5 3"
											/>
											<path
												d="M12.5 21H8a4 4 0 0 1-4-4v-1a8 8 0 0 1 14.946-3.971M16 19h6m-3-3l3 3l-3 3"
											/>
										</g>
									</svg>
								</td>
							</tr>
						{/each}

						<tr>
							<td colspan="3">
								<button
									class="btn btn-ghost btn-xs w-full opacity-50"
									onclick={() => (showNewItemModal = true)}>+ Add Item</button
								>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	{/each}
	<button
		class="btn btn-ghost btn-sm w-full mt-2 opacity-50"
		onclick={() => (showCategoryModal = true)}>+ Add Category</button
	>
</div>

<dialog class="modal" class:modal-open={showCategoryModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Category</h3>
		<form {...create_category} onsubmit={() => (showCategoryModal = false)}>
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
						showCategoryModal = false;
					}}>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showCategoryModal = false)}>close</button>
	</form>
</dialog>

<dialog class="modal" class:modal-open={showEditCategoryModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Category</h3>
		<form {...update_category} onsubmit={() => (showEditCategoryModal = false)}>
			<input {...update_category.fields.id.as('text')} type="hidden" bind:value={editCategoryID} />
			<div class="form-control mt-4">
				<label class="label" for="category-name">
					<span class="label-text">Name</span>
				</label>
				<input
					{...update_category.fields.name.as('text')}
					bind:value={editCategoryName}
					class="input input-bordered input-sm"
					id="category-name"
				/>
			</div>
			<div class="modal-action justify-between">
				<button class="btn btn-error btn-sm" onclick={() => (showEditCategoryModal = false)}
					>Delete</button
				>
				<div class="flex gap-2">
					<button
						class="btn btn-ghost btn-sm"
						onclick={(e: Event) => {
							e.preventDefault();
							showEditCategoryModal = false;
						}}>Cancel</button
					>
					<button class="btn btn-primary btn-sm" type="submit">Save</button>
				</div>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showEditCategoryModal = false)}>close</button>
	</form>
</dialog>

<dialog class="modal" class:modal-open={showNewItemModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Item</h3>
		<div class="form-control mt-4">
			<label class="label">
				<span class="label-text">Name</span>
			</label>
			<input
				type="text"
				placeholder="e.g. Netflix"
				class="input input-bordered input-sm"
				bind:value={newItemName}
			/>
		</div>
		<div class="form-control mt-2">
			<label class="label">
				<span class="label-text">Amount</span>
			</label>
			<input
				type="number"
				placeholder="0"
				class="input input-bordered input-sm"
				bind:value={newItemAmount}
			/>
		</div>
		<div class="form-control mt-4">
			<label class="label cursor-pointer justify-start gap-3">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={newItemBillsPot} />
				<span class="label-text">Bills Pot</span>
			</label>
		</div>
		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={() => (showNewItemModal = false)}>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={() => (showNewItemModal = false)}>Add</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showNewItemModal = false)}>close</button>
	</form>
</dialog>

<dialog class="modal" class:modal-open={showEditItemModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Item</h3>
		<div class="form-control mt-4">
			<label class="label">
				<span class="label-text">Name</span>
			</label>
			<input type="text" class="input input-bordered input-sm" bind:value={editItemName} />
		</div>
		<div class="form-control mt-2">
			<label class="label">
				<span class="label-text">Amount</span>
			</label>
			<input type="number" class="input input-bordered input-sm" bind:value={editItemAmount} />
		</div>
		<div class="form-control mt-4">
			<label class="label cursor-pointer justify-start gap-3">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={editItemBillsPot} />
				<span class="label-text">Bills Pot</span>
			</label>
		</div>
		<div class="modal-action justify-between">
			<button class="btn btn-error btn-sm" onclick={() => (showEditItemModal = false)}
				>Delete</button
			>
			<div class="flex gap-2">
				<button class="btn btn-ghost btn-sm" onclick={() => (showEditItemModal = false)}
					>Cancel</button
				>
				<button class="btn btn-primary btn-sm" onclick={() => (showEditItemModal = false)}
					>Save</button
				>
			</div>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showEditItemModal = false)}>close</button>
	</form>
</dialog>
