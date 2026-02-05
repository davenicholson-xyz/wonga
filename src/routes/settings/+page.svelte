<script>
	import { resolve } from '$app/paths';
	import {
		get_payment_settings,
		save_payment_settings,
		get_rate_settings,
		save_rate_settings,
		get_theme_setting,
		save_theme_setting
	} from '$lib/funcs/settings.remote';
	import { get_customers, update_customer, delete_customer } from '$lib/funcs/customers.remote';

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

	// Rates
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

	// Theme
	const themes = [
		'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave',
		'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua',
		'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula',
		'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee',
		'winter', 'dim', 'nord', 'sunset'
	];

	const themeData = get_theme_setting();
	const themeSetting = $derived(themeData.current);
	let selectedTheme = $state('dim');

	$effect(() => {
		if (themeSetting) {
			selectedTheme = themeSetting.theme;
		}
	});

	/** @param {string} theme */
	function applyTheme(theme) {
		selectedTheme = theme;
		document.documentElement.setAttribute('data-theme', theme);
		save_theme_setting({ theme });
	}

	// Customers
	const customersData = get_customers();
	const customers = $derived(customersData.current ?? []);

	/** @type {HTMLDialogElement} */
	let editModal;
	/** @type {HTMLDialogElement} */
	let deleteModal;
	let editId = $state('');
	let editName = $state('');
	let editAddress = $state('');
	let editEmail = $state('');
	let editSaving = $state(false);

	let deleteId = $state('');
	let deleteName = $state('');
	let deleteError = $state('');
	let deleting = $state(false);

	/** @param {{id: string, name: string, address: string, email: string}} c */
	function openEdit(c) {
		editId = c.id;
		editName = c.name;
		editAddress = c.address;
		editEmail = c.email;
		editSaving = false;
		editModal.showModal();
	}

	async function saveEdit() {
		editSaving = true;
		await update_customer({ id: editId, name: editName, address: editAddress, email: editEmail });
		customersData.refresh();
		editSaving = false;
		editModal.close();
	}

	/** @param {{id: string, name: string}} c */
	function openDelete(c) {
		deleteId = c.id;
		deleteName = c.name;
		deleteError = '';
		deleting = false;
		deleteModal.showModal();
	}

	async function confirmDelete() {
		deleting = true;
		deleteError = '';
		try {
			await delete_customer({ id: deleteId });
			customersData.refresh();
			deleteModal.close();
		} catch (/** @type {any} */ e) {
			deleteError = e?.message ?? 'Failed to delete customer';
		}
		deleting = false;
	}

	// Data import/export
	let importing = $state(false);
	let importError = $state('');
	let importSuccess = $state(false);
	let showImportConfirm = $state(false);
	/** @type {HTMLInputElement} */
	let fileInput;
	/** @type {any} */
	let pendingImportData = $state(null);

	function handleFileSelect(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		const file = input.files?.[0];
		if (!file) return;

		importError = '';
		importSuccess = false;

		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				pendingImportData = JSON.parse(/** @type {string} */ (evt.target?.result));
				if (!pendingImportData?.version || !pendingImportData?.exported_at) {
					importError = 'Invalid backup file format.';
					pendingImportData = null;
				} else {
					showImportConfirm = true;
				}
			} catch {
				importError = 'Could not parse file. Make sure it is a valid Wonga backup.';
			}
			input.value = '';
		};
		reader.readAsText(file);
	}

	async function doImport() {
		showImportConfirm = false;
		importing = true;
		importError = '';
		importSuccess = false;
		try {
			const res = await fetch(resolve('/settings/import'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(pendingImportData)
			});
			const result = await res.json();
			if (!res.ok) {
				importError = result.error ?? 'Import failed';
			} else {
				importSuccess = true;
				setTimeout(() => (importSuccess = false), 3000);
			}
		} catch (/** @type {any} */ e) {
			importError = e?.message ?? 'Import failed';
		}
		importing = false;
		pendingImportData = null;
	}
</script>

<h1 class="text-2xl font-bold mb-6">Settings</h1>

<div class="tabs tabs-lift">
	<input type="radio" name="settings_tabs" class="tab" aria-label="Payment Details" checked />
	<div class="tab-content bg-base-200 border-base-300 p-4">
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

	<input type="radio" name="settings_tabs" class="tab" aria-label="Rates" />
	<div class="tab-content bg-base-200 border-base-300 p-4">
		<div class="form-control">
			<label class="label" for="hourly-rate">
				<span class="label-text">Hourly Rate</span>
			</label>
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
			<p class="text-xs text-base-content/40 mt-1">
				Used for timesheet earnings and invoice prices
			</p>
		</div>

		<div class="mt-4 flex items-center gap-2">
			<button class="btn btn-primary btn-sm" onclick={saveRate} disabled={rateSaving}>
				{rateSaving ? 'Saving...' : 'Save'}
			</button>
			{#if rateSaved}
				<span class="text-sm text-success">Saved</span>
			{/if}
		</div>
	</div>

	<input type="radio" name="settings_tabs" class="tab" aria-label="Customers" />
	<div class="tab-content bg-base-200 border-base-300 p-4">
		{#if customers.length === 0}
			<p class="text-sm text-base-content/60">No customers yet.</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each customers as c (c.id)}
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body p-4">
							<h3 class="font-semibold">{c.name}</h3>
							<p class="text-sm text-base-content/60">{c.email}</p>
							<p class="text-sm text-base-content/60 whitespace-pre-line mt-1">{c.address}</p>
							<div class="card-actions mt-2">
								<button class="btn btn-ghost btn-xs" onclick={() => openEdit(c)}>Edit</button>
								<button class="btn btn-ghost btn-xs text-error" onclick={() => openDelete(c)}
									>Delete</button
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<input type="radio" name="settings_tabs" class="tab" aria-label="UI" />
	<div class="tab-content bg-base-200 border-base-300 p-4">
		<div class="form-control">
			<label class="label" for="theme-select">
				<span class="label-text">Color Theme</span>
			</label>
			<select
				id="theme-select"
				class="select select-bordered select-sm w-full"
				value={selectedTheme}
				onchange={(e) => applyTheme(e.currentTarget.value)}
			>
				{#each themes as theme}
					<option value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</option>
				{/each}
			</select>
		</div>

		<div class="mt-4 rounded-lg overflow-hidden border border-base-300" data-theme={selectedTheme}>
			<div class="bg-base-100 p-4">
				<div class="flex items-center justify-between mb-3">
					<span class="text-base-content font-semibold text-sm">Preview</span>
					<div class="flex gap-1">
						<span class="badge badge-sm badge-primary">Primary</span>
						<span class="badge badge-sm badge-secondary">Secondary</span>
						<span class="badge badge-sm badge-accent">Accent</span>
					</div>
				</div>
				<div class="flex gap-2 mb-3">
					<button class="btn btn-primary btn-xs">Button</button>
					<button class="btn btn-secondary btn-xs">Button</button>
					<button class="btn btn-accent btn-xs">Button</button>
					<button class="btn btn-neutral btn-xs">Button</button>
				</div>
				<div class="bg-base-200 rounded-lg p-3">
					<div class="flex items-center gap-3">
						<div class="flex gap-1">
							<span class="size-4 rounded-full bg-primary"></span>
							<span class="size-4 rounded-full bg-secondary"></span>
							<span class="size-4 rounded-full bg-accent"></span>
							<span class="size-4 rounded-full bg-neutral"></span>
						</div>
						<div class="flex gap-1">
							<span class="size-4 rounded bg-info"></span>
							<span class="size-4 rounded bg-success"></span>
							<span class="size-4 rounded bg-warning"></span>
							<span class="size-4 rounded bg-error"></span>
						</div>
					</div>
					<p class="text-xs text-base-content/60 mt-2">Sample text on base-200</p>
				</div>
			</div>
		</div>
	</div>

	<input type="radio" name="settings_tabs" class="tab" aria-label="Data" />
	<div class="tab-content bg-base-200 border-base-300 p-4">
		<div class="space-y-6">
			<div>
				<h3 class="font-semibold text-sm mb-2">Export</h3>
				<p class="text-xs text-base-content/60 mb-3">
					Download a backup of all your data including invoices, customers, timesheets, budget, and
					settings.
				</p>
				<a href={resolve('/settings/export')} download class="btn btn-primary btn-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-4"
					>
						<path
							d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"
						/>
						<path
							d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
						/>
					</svg>
					Download Backup
				</a>
			</div>

			<div class="divider my-0"></div>

			<div>
				<h3 class="font-semibold text-sm mb-2">Import</h3>
				<p class="text-xs text-base-content/60 mb-3">
					Restore from a backup file. This will replace all existing data.
				</p>
				<button
					class="btn btn-sm btn-outline"
					onclick={() => fileInput.click()}
					disabled={importing}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-4"
					>
						<path
							d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z"
						/>
						<path
							d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
						/>
					</svg>
					{importing ? 'Importing...' : 'Upload Backup'}
				</button>
				<input
					bind:this={fileInput}
					type="file"
					accept=".json"
					class="hidden"
					onchange={handleFileSelect}
				/>
				{#if importError}
					<div class="alert alert-error mt-3 text-sm">{importError}</div>
				{/if}
				{#if importSuccess}
					<div class="alert alert-success mt-3 text-sm">Data restored successfully.</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Edit Customer Modal -->
<dialog bind:this={editModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Customer</h3>
		<div class="form-control mt-4">
			<label class="label" for="edit-name">
				<span class="label-text">Name</span>
			</label>
			<input
				id="edit-name"
				type="text"
				class="input input-bordered input-sm w-full"
				bind:value={editName}
			/>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-address">
				<span class="label-text">Address</span>
			</label>
			<textarea
				id="edit-address"
				class="textarea textarea-bordered textarea-sm w-full"
				rows="3"
				bind:value={editAddress}
			></textarea>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-email">
				<span class="label-text">Email</span>
			</label>
			<input
				id="edit-email"
				type="email"
				class="input input-bordered input-sm w-full"
				bind:value={editEmail}
			/>
		</div>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => editModal.close()}
				>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={saveEdit} disabled={editSaving}>
				{editSaving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Import Confirmation Modal -->
<dialog class="modal" class:modal-open={showImportConfirm}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Restore Data</h3>
		<p class="py-4 text-sm text-base-content/70">
			This will <strong>replace all existing data</strong> with the backup from
			{#if pendingImportData}
				<strong
					>{new Date(pendingImportData.exported_at).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})}</strong
				>.
			{/if}
			This cannot be undone.
		</p>
		<div class="modal-action">
			<button
				class="btn btn-ghost btn-sm"
				onclick={() => {
					showImportConfirm = false;
					pendingImportData = null;
				}}>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={doImport}>Restore</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button
			onclick={() => {
				showImportConfirm = false;
				pendingImportData = null;
			}}>close</button
		>
	</form>
</dialog>

<!-- Delete Customer Modal -->
<dialog bind:this={deleteModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Delete Customer</h3>
		<p class="mt-4">Are you sure you want to delete <strong>{deleteName}</strong>?</p>
		{#if deleteError}
			<div class="alert alert-error mt-4">
				<span>{deleteError}</span>
			</div>
		{/if}
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => deleteModal.close()}
				>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={confirmDelete} disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
