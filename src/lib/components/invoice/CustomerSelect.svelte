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

<div>
	<label class="label" for="customer-select">
		<span class="label-text">Customer</span>
	</label>
	<div class="flex gap-2">
		<select id="customer-select" class="select select-bordered select-sm grow" bind:value>
			{#each await get_customers() as customer (customer.id)}
				<option value={customer.id}>{customer.name}</option>
			{/each}
		</select>
		<button
			type="button"
			class="btn btn-ghost btn-sm btn-square"
			aria-label="Add new customer"
			onclick={openNewCustomerModal}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="size-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</button>
	</div>
</div>

<dialog bind:this={newCustomerModal} class="modal">
	<div class="modal-box p-0 overflow-hidden">
		<div class="bg-gradient-to-br from-info/15 to-info/5 px-5 py-4">
			<h3 class="font-bold text-lg">New Customer</h3>
		</div>
		<form {...create_customer} class="px-5 py-4">
			<div class="form-control">
				<label class="label" for="customerName">
					<span class="label-text">Name</span>
				</label>
				<input
					{...create_customer.fields.name.as('text')}
					id="customerName"
					class="input input-bordered input-sm"
				/>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="customerAddress">
					<span class="label-text">Address</span>
				</label>
				<textarea
					{...create_customer.fields.address.as('text')}
					id="customerAddress"
					class="textarea textarea-bordered textarea-sm"
				></textarea>
			</div>
			<div class="form-control mt-2">
				<label class="label" for="customerEmail">
					<span class="label-text">Email</span>
				</label>
				<input
					{...create_customer.fields.email.as('email')}
					id="customerEmail"
					class="input input-bordered input-sm"
				/>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button type="button" class="btn btn-ghost btn-sm" onclick={closeNewCustomerModal}
					>Cancel</button
				>
				<button class="btn btn-primary btn-sm" type="submit">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeNewCustomerModal}>close</button>
	</form>
</dialog>
