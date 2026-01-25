<script lang="ts">
	import { create_customer, get_customers } from '$lib/funcs/customers.remote';

	const customers = await get_customers();

	let { value = $bindable() }: { value?: string } = $props();
	if (customers.length > 0) value = customers[0].id;

	$effect(() => {
		if (create_customer.result) {
			value = create_customer.result.id;
			closeNewCustomerModal();
		}
	});

	let newCustomerModal: HTMLDialogElement;
	function openNewCustomerModal() {
		newCustomerModal.showModal();
	}
	function closeNewCustomerModal() {
		newCustomerModal.close();
	}
</script>

<select bind:value>
	{#each await get_customers() as customer (customer.id)}
		<option value={customer.id}>{customer.name}</option>
	{/each}
</select>

<button onclick={openNewCustomerModal}>New Customer</button>

<dialog bind:this={newCustomerModal}>
	<button onclick={closeNewCustomerModal}>close</button>
	<form {...create_customer}>
		<label>
			Name:
			<input {...create_customer.fields.name.as('text')} />
		</label>
		<label>
			Address:
			<textarea {...create_customer.fields.address.as('text')}></textarea>
		</label>
		<label>
			Email:
			<input {...create_customer.fields.email.as('email')} />
		</label>
		<button type="submit">Create Customer</button>
	</form>
</dialog>
