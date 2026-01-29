<script lang="ts">
	import { formatCurrency } from '$lib/helpers';
	let { value = $bindable(''), total = $bindable(0) } = $props();

	type InvoiceItem = {
		name: string;
		description: string;
		price: number;
		quantity: number;
		total: number;
	};

	let newItemModal: HTMLDialogElement;

	function openNewItemModal() {
		newItemModal.showModal();
	}

	function closeNewItemModal() {
		newItemModal.close();
	}

	function addItem() {
		invoiceItems.push({
			name: itemName,
			description: itemDescription,
			price: itemPrice,
			quantity: itemQuantity,
			total: itemPrice * itemQuantity
		});
		total = total + itemPrice * itemQuantity;
		itemName = '';
		itemDescription = '';
		itemPrice = 30;
		itemQuantity = 1;
		closeNewItemModal();
	}

	function removeItem(index: number) {
		total = total - invoiceItems[index].total;
		invoiceItems.splice(index, 1);
	}

	function saveItem() {
		const item = invoiceItems[editIndex];
		total = total - item.total;
		item.name = editName;
		item.description = editDescription;
		item.price = editPrice;
		item.quantity = editQuantity;
		item.total = editPrice * editQuantity;
		total = total + item.total;
		showEditModal = false;
	}

	let invoiceItems = $state<InvoiceItem[]>([]);

	let itemName = $state('');
	let itemDescription = $state('');
	let itemPrice = $state(30);
	let itemQuantity = $state(1);

	let showEditModal = $state(false);
	let editIndex = $state(0);
	let editName = $state('');
	let editDescription = $state('');
	let editPrice = $state(0);
	let editQuantity = $state(0);

	function openEditModal(index: number) {
		const item = invoiceItems[index];
		editIndex = index;
		editName = item.name;
		editDescription = item.description;
		editPrice = item.price;
		editQuantity = item.quantity;
		showEditModal = true;
	}

	$effect(() => {
		value = JSON.stringify(
			invoiceItems.map((item) => ({
				name: item.name,
				description: item.description,
				price: item.price,
				quantity: item.quantity
			}))
		);
	});
</script>

{#if invoiceItems.length > 0}
	<table class="table table-xs">
		<tbody>
			{#each invoiceItems as item, i (item)}
				<tr class="cursor-pointer hover" onclick={() => openEditModal(i)}>
					<td>
						<div class="font-bold text-sm">{item.name}</div>
						{#if item.description}
							<div class="text-xs text-base-content/60">{item.description}</div>
						{/if}
					</td>
					<td class="text-right text-sm">{item.quantity} x {formatCurrency(item.price)}</td>
					<td class="text-right font-bold text-sm">{formatCurrency(item.total)}</td>
				</tr>
			{/each}
			<tr>
				<td colspan="2" class="text-right font-bold text-sm">Total</td>
				<td class="text-right font-bold text-sm">{formatCurrency(total)}</td>
			</tr>
		</tbody>
	</table>
{/if}

<button class="btn btn-ghost btn-sm w-full opacity-50 mt-4" onclick={openNewItemModal}
	>+ Add Item</button
>

<dialog bind:this={newItemModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Add Item</h3>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				addItem();
			}}
		>
			<div class="form-control mt-4">
				<label class="label" for="itemName">
					<span class="label-text">Name</span>
				</label>
				<input
					id="itemName"
					type="text"
					class="input input-bordered input-sm"
					bind:value={itemName}
				/>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="itemDescription">
					<span class="label-text">Description</span>
				</label>
				<input
					id="itemDescription"
					type="text"
					class="input input-bordered input-sm"
					bind:value={itemDescription}
				/>
			</div>
			<div class="flex gap-3 mt-2">
				<div class="form-control grow">
					<label class="label" for="itemPrice">
						<span class="label-text">Price</span>
					</label>
					<label class="input input-bordered input-sm flex items-center gap-1">
						<span class="text-base-content/60">£</span>
						<input
							id="itemPrice"
							type="number"
							class="grow bg-transparent w-full"
							bind:value={itemPrice}
						/>
					</label>
				</div>
				<div class="form-control grow">
					<label class="label" for="itemQuantity">
						<span class="label-text">Quantity</span>
					</label>
					<input
						id="itemQuantity"
						type="number"
						class="input input-bordered input-sm"
						bind:value={itemQuantity}
					/>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost btn-sm" onclick={closeNewItemModal}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary btn-sm">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeNewItemModal}>close</button>
	</form>
</dialog>

<dialog class="modal" class:modal-open={showEditModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Item</h3>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveItem();
			}}
		>
			<div class="form-control mt-4">
				<label class="label" for="editName">
					<span class="label-text">Name</span>
				</label>
				<input
					id="editName"
					type="text"
					class="input input-bordered input-sm"
					bind:value={editName}
				/>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="editDescription">
					<span class="label-text">Description</span>
				</label>
				<input
					id="editDescription"
					type="text"
					class="input input-bordered input-sm"
					bind:value={editDescription}
				/>
			</div>
			<div class="flex gap-3 mt-2">
				<div class="form-control grow">
					<label class="label" for="editPrice">
						<span class="label-text">Price</span>
					</label>
					<label class="input input-bordered input-sm flex items-center gap-1">
						<span class="text-base-content/60">£</span>
						<input
							id="editPrice"
							type="number"
							class="grow bg-transparent w-full"
							bind:value={editPrice}
						/>
					</label>
				</div>
				<div class="form-control grow">
					<label class="label" for="editQuantity">
						<span class="label-text">Quantity</span>
					</label>
					<input
						id="editQuantity"
						type="number"
						class="input input-bordered input-sm"
						bind:value={editQuantity}
					/>
				</div>
			</div>
			<div class="modal-action justify-between">
				<button
					type="button"
					class="btn btn-error btn-sm"
					onclick={() => {
						removeItem(editIndex);
						showEditModal = false;
					}}>Delete</button
				>
				<div class="flex gap-2">
					<button type="button" class="btn btn-ghost btn-sm" onclick={() => (showEditModal = false)}
						>Cancel</button
					>
					<button type="submit" class="btn btn-primary btn-sm">Save</button>
				</div>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (showEditModal = false)}>close</button>
	</form>
</dialog>
