<script>
	import { get_payment_settings, save_payment_settings } from '$lib/funcs/settings.remote';

	const data = get_payment_settings();
	const current = $derived(data.current);

	let payment_name = $state('');
	let account_number = $state('');
	let sort_code = $state('');
	let address = $state('');
	let email = $state('');
	let saving = $state(false);
	let saved = $state(false);

	$effect(() => {
		if (current) {
			payment_name = current.payment_name;
			account_number = current.account_number;
			sort_code = current.sort_code;
			address = current.address;
			email = current.email;
		}
	});

	async function save() {
		saving = true;
		saved = false;
		await save_payment_settings({ payment_name, account_number, sort_code, address, email });
		data.refresh();
		saving = false;
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}
</script>

<h1 class="text-2xl font-bold mb-6">Settings</h1>

<div class="card bg-base-200 shadow-sm">
	<div class="card-body p-4">
		<h2 class="card-title text-base mb-2">Payment Details</h2>

		<div class="form-control">
			<label class="label" for="payment-name">
				<span class="label-text">Payment Name</span>
			</label>
			<input
				id="payment-name"
				type="text"
				class="input input-bordered input-sm w-full"
				placeholder="e.g. John Smith"
				bind:value={payment_name}
			/>
		</div>

		<div class="form-control mt-2">
			<label class="label" for="account-number">
				<span class="label-text">Account Number</span>
			</label>
			<input
				id="account-number"
				type="text"
				class="input input-bordered input-sm w-full"
				placeholder="e.g. 12345678"
				bind:value={account_number}
			/>
		</div>

		<div class="form-control mt-2">
			<label class="label" for="sort-code">
				<span class="label-text">Sort Code</span>
			</label>
			<input
				id="sort-code"
				type="text"
				class="input input-bordered input-sm w-full"
				placeholder="e.g. 12-34-56"
				bind:value={sort_code}
			/>
		</div>

		<div class="form-control mt-2">
			<label class="label" for="address">
				<span class="label-text">Address</span>
			</label>
			<textarea
				id="address"
				class="textarea textarea-bordered textarea-sm w-full"
				rows="3"
				placeholder="e.g. 10 Downing Street&#10;London&#10;SW1A 2AA"
				bind:value={address}
			></textarea>
		</div>

		<div class="form-control mt-2">
			<label class="label" for="email">
				<span class="label-text">Email</span>
			</label>
			<input
				id="email"
				type="email"
				class="input input-bordered input-sm w-full"
				placeholder="e.g. you@example.com"
				bind:value={email}
			/>
		</div>

		<div class="mt-4 flex items-center gap-2">
			<button class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
				{saving ? 'Saving...' : 'Save'}
			</button>
			{#if saved}
				<span class="text-sm text-success">Saved</span>
			{/if}
		</div>
	</div>
</div>
