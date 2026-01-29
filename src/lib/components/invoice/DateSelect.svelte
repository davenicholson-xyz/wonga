<script lang="ts">
	let { invoiceDate = $bindable(new Date().toISOString().split('T')[0]), dueDate = $bindable() } =
		$props();

	if (!invoiceDate) {
		invoiceDate = new Date().toISOString().split('T')[0];
	}

	let dueDays = $state(30);

	$effect(() => {
		const date = new Date(invoiceDate);
		dueDate = new Date(date.getTime() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
	});
</script>

<div class="flex items-end gap-2">
	<div>
		<label class="label" for="invoiceDate">
			<span class="label-text">Invoice Date</span>
		</label>
		<input
			type="date"
			id="invoiceDate"
			class="input input-bordered input-sm"
			bind:value={invoiceDate}
		/>
	</div>
	<div>
		<label class="label" for="dueDays">
			<span class="label-text" id="dueDays">Days</span>
		</label>
		<input
			type="number"
			class="input input-bordered input-sm w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
			bind:value={dueDays}
		/>
	</div>
	<div>
		<label class="label" for="dueDate">
			<span class="label-text">Due Date</span>
		</label>
		<input type="date" id="dueDate" class="input input-bordered input-sm" bind:value={dueDate} />
	</div>
</div>
