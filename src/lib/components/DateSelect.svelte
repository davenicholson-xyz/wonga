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

<input type="date" bind:value={invoiceDate} />
<input type="number" bind:value={dueDays} />
<input type="date" bind:value={dueDate} />
