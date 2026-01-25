<script lang="ts">
	import { get_income_for } from '$lib/funcs/income.remote';

	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	const { total: income } = await get_income_for({ month: this_month, year: this_year });

	// Placeholder values - to be calculated later
	const outgoing = 1500;
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
	let newCategoryName = $state('');
	let showEditCategoryModal = $state(false);
	let editCategoryName = $state('');
	let showNewItemModal = $state(false);
	let newItemName = $state('');
	let newItemAmount = $state(0);
	let newItemBillsPot = $state(false);
	let showEditItemModal = $state(false);
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

	<!-- Bills Category -->
	<div class="card bg-base-100 shadow-sm mt-2">
		<div class="card-body p-3">
			<div class="flex justify-between items-center">
				<button
					class="font-bold text-sm hover:underline text-left"
					onclick={() => {
						editCategoryName = 'Household';
						showEditCategoryModal = true;
					}}
				>
					Household
				</button>
				<span class="text-sm font-bold">{formatCurrency(600)}</span>
			</div>
			<table class="table table-xs">
				<tbody>
					<tr
						class="cursor-pointer hover"
						onclick={() => {
							editItemName = 'Rent';
							editItemAmount = 850;
							editItemBillsPot = true;
							showEditItemModal = true;
						}}
					>
						<td>Rent</td>
						<td class="text-right">{formatCurrency(850)}</td>
						<td class="w-8 text-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-3 h-3 text-primary"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
								/>
							</svg>
						</td>
					</tr>
					<tr
						class="cursor-pointer hover"
						onclick={() => {
							editItemName = 'Electric';
							editItemAmount = 120;
							editItemBillsPot = true;
							showEditItemModal = true;
						}}
					>
						<td>Electric</td>
						<td class="text-right">{formatCurrency(120)}</td>
						<td class="w-8 text-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-3 h-3 text-primary"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
								/>
							</svg>
						</td>
					</tr>
					<tr
						class="cursor-pointer hover"
						onclick={() => {
							editItemName = 'Internet';
							editItemAmount = 45;
							editItemBillsPot = true;
							showEditItemModal = true;
						}}
					>
						<td>Internet</td>
						<td class="text-right">{formatCurrency(45)}</td>
						<td class="w-8 text-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-3 h-3 text-primary"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
								/>
							</svg>
						</td>
					</tr>
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

	<button
		class="btn btn-ghost btn-sm w-full mt-2 opacity-50"
		onclick={() => (showCategoryModal = true)}>+ Add Category</button
	>
</div>

<dialog class="modal" class:modal-open={showCategoryModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">New Category</h3>
		<div class="form-control mt-4">
			<label class="label">
				<span class="label-text">Category Name</span>
			</label>
			<input
				type="text"
				placeholder="e.g. Subscriptions"
				class="input input-bordered input-sm"
				bind:value={newCategoryName}
			/>
		</div>
		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={() => (showCategoryModal = false)}
				>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={() => (showCategoryModal = false)}
				>Create</button
			>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showCategoryModal = false)}>close</button>
	</form>
</dialog>

<dialog class="modal" class:modal-open={showEditCategoryModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Category</h3>
		<div class="form-control mt-4">
			<label class="label">
				<span class="label-text">Category Name</span>
			</label>
			<input type="text" class="input input-bordered input-sm" bind:value={editCategoryName} />
		</div>
		<div class="modal-action justify-between">
			<button class="btn btn-error btn-sm" onclick={() => (showEditCategoryModal = false)}
				>Delete</button
			>
			<div class="flex gap-2">
				<button class="btn btn-ghost btn-sm" onclick={() => (showEditCategoryModal = false)}
					>Cancel</button
				>
				<button class="btn btn-primary btn-sm" onclick={() => (showEditCategoryModal = false)}
					>Save</button
				>
			</div>
		</div>
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
