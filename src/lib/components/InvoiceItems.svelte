<script lang="ts">
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

	let invoiceItems = $state<InvoiceItem[]>([]);

	let itemName = $state('');
	let itemDescription = $state('');
	let itemPrice = $state(30);
	let itemQuantity = $state(1);

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
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Description</th>
				<th>Price</th>
				<th>Quantity</th>
				<th>Total</th>
				<th>Action</th>
			</tr>
		</thead>
		<tbody>
			{#each invoiceItems as item (item)}
				<tr>
					<td>{item.name}</td>
					<td>{item.description}</td>
					<td>{item.price}</td>
					<td>{item.quantity}</td>
					<td>{item.total}</td>
					<td><button onclick={() => removeItem(invoiceItems.indexOf(item))}>remove</button></td>
				</tr>
			{/each}
			<tr>
				<td colspan="4">Total</td>
				<td>{total}</td>
			</tr>
		</tbody>
	</table>
{/if}
<button onclick={openNewItemModal}>Add Item</button>

<dialog bind:this={newItemModal}>
	<button onclick={closeNewItemModal}>close</button>
	<form>
		<label>
			Name:
			<input type="text" bind:value={itemName} />
		</label>
		<label>
			Description:
			<input type="text" bind:value={itemDescription} />
		</label>
		<label>
			Price:
			<input type="number" bind:value={itemPrice} />
		</label>
		<label>
			Quantity:
			<input type="number" bind:value={itemQuantity} />
		</label>
		<button onclick={addItem}>add</button>
	</form>
</dialog>
