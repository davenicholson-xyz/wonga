<script>
	import {
		get_rate_settings,
		save_rate_settings
	} from '$lib/funcs/settings.remote';

	const rateData = get_rate_settings();
	const rateSettings = $derived(rateData.current);

	let hourly_rate = $state(30);
	let rateSaving = $state(false);
	let rateSaved = $state(false);

	$effect(() => {
		if (rateSettings) {
			hourly_rate = rateSettings.hourly_rate;
		}
	});

	async function saveRate() {
		rateSaving = true;
		rateSaved = false;
		await save_rate_settings({ hourly_rate });
		rateData.refresh();
		rateSaving = false;
		rateSaved = true;
		setTimeout(() => (rateSaved = false), 2000);
	}
</script>

<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
	<h2 class="text-sm font-semibold text-base-content/60 mb-3">Hourly Rate</h2>
	<div class="form-control">
		<label class="input input-bordered input-sm flex items-center gap-1 w-full">
			<span class="text-base-content/60">£</span>
			<input
				id="hourly-rate"
				type="number"
				class="grow bg-transparent w-full"
				placeholder="e.g. 30"
				bind:value={hourly_rate}
			/>
		</label>
		<p class="text-[11px] text-base-content/40 mt-1.5">
			Used for timesheet earnings and invoice prices
		</p>
	</div>

	<div class="mt-4 flex items-center gap-2">
		<button class="btn btn-primary btn-sm" onclick={saveRate} disabled={rateSaving}>
			{rateSaving ? 'Saving...' : 'Save'}
		</button>
		{#if rateSaved}
			<span class="text-xs text-success">Saved</span>
		{/if}
	</div>
</div>
