<script lang="ts">
	import { get_income_for } from '$lib/funcs/income.remote';

	const this_month = (new Date().getMonth() + 1) as number;
	const this_year = parseInt(new Date().getFullYear().toString());

	const { total } = await get_income_for({ month: this_month, year: this_year });
</script>

<div>
	<p>total: {total}</p>
</div>
