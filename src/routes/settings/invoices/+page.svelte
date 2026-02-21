<script>
	import {
		get_auto_send_settings,
		save_auto_send_settings
	} from '$lib/funcs/settings.remote';

	const data = get_auto_send_settings();
	const current = $derived(data.current);

	let enabled = $state(false);
	let time = $state('09:00');
	let requireTimesheet = $state(false);
	let initialized = $state(false);

	$effect(() => {
		if (current && !initialized) {
			enabled = current.enabled;
			time = current.time;
			requireTimesheet = current.require_timesheet;
			initialized = true;
		}
	});

	function save() {
		save_auto_send_settings({ enabled, time, require_timesheet: requireTimesheet });
	}
</script>

<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
	<h2 class="text-sm font-semibold text-base-content/60 mb-3">Auto-Send Invoices</h2>
	<p class="text-[11px] text-base-content/40 mb-4">
		Automatically email invoices on their invoice date. Invoices must be individually opted in.
	</p>

	<div class="space-y-4">
		<label class="flex items-center justify-between cursor-pointer">
			<div>
				<span class="text-sm font-medium">Enable auto-send</span>
				<p class="text-[11px] text-base-content/40">Process opted-in invoices daily</p>
			</div>
			<input
				type="checkbox"
				class="toggle toggle-sm toggle-primary"
				bind:checked={enabled}
				onchange={save}
			/>
		</label>

		<div class="form-control">
			<label class="label" for="auto-send-time">
				<span class="label-text text-xs">Send time</span>
			</label>
			<input
				id="auto-send-time"
				type="time"
				class="input input-bordered input-sm w-32"
				bind:value={time}
				onchange={save}
				disabled={!enabled}
			/>
			<p class="text-[11px] text-base-content/40 mt-1">
				Schedule your cron job to run at or after this time
			</p>
		</div>

		<label class="flex items-center justify-between cursor-pointer">
			<div>
				<span class="text-sm font-medium">Require timesheet</span>
				<p class="text-[11px] text-base-content/40">Only auto-send invoices with a timesheet attached</p>
			</div>
			<input
				type="checkbox"
				class="toggle toggle-sm toggle-primary"
				bind:checked={requireTimesheet}
				onchange={save}
				disabled={!enabled}
			/>
		</label>
	</div>
</div>
