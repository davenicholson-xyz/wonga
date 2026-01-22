<script lang="ts">
	import { create_customer, create_invoice, get_customers } from '../invoices.remote';

	let newCustomerModal: HTMLDialogElement;
	function openNewCustomerModal() {
		newCustomerModal.showModal();
	}
	function closeNewCustomerModal() {
		newCustomerModal.close();
	}

	$effect(() => {
		if (create_customer.result) {
			closeNewCustomerModal();
		}
	});

	let invoiceDate = $state(new Date().toISOString().split('T')[0]);
	let dueDays = $state(30);
	let dueDate = $derived(
		new Date(new Date(invoiceDate).getTime() + dueDays * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0]
	);
</script>

<h1>New Invoice</h1>

<form {...create_invoice}>
	<label>
		<select {...create_invoice.fields.customer_id.as('text')}>
			{#each await get_customers() as customer (customer.id)}
				<option value={customer.id}>{customer.name}</option>
			{/each}
		</select>
	</label>
	<button onclick={openNewCustomerModal}>add customer</button>

	<hr />

	<label>
		Invoice date:
		<input {...create_invoice.fields.invoice_date.as('date')} bind:value={invoiceDate} />
		<span>
			due in <input type="number" bind:value={dueDays} /> days
		</span>
		<input {...create_invoice.fields.due_date.as('date')} bind:value={dueDate} />
	</label>
</form>

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
