<script>
	import { resolve } from '$app/paths';
	import {
		get_payment_settings,
		save_payment_settings,
		get_rate_settings,
		save_rate_settings,
		get_theme_setting,
		save_theme_setting,
		get_image_size_setting,
		save_image_size_setting
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
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula',
		'cmyk',
		'autumn',
		'business',
		'acid',
		'lemonade',
		'night',
		'coffee',
		'winter',
		'dim',
		'nord',
		'sunset'
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

	// Image Size
	const imageSizeData = get_image_size_setting();
	const imageSizeSetting = $derived(imageSizeData.current);
	/** @type {'small' | 'medium' | 'large'} */
	let selectedImageSize = $state('medium');

	$effect(() => {
		if (imageSizeSetting) {
			selectedImageSize = imageSizeSetting.image_size;
		}
	});

	/** @param {'small' | 'medium' | 'large'} size */
	function setImageSize(size) {
		selectedImageSize = size;
		save_image_size_setting({ size });
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

	// Tabs
	let activeTab = $state('payment');

	// Data import/export
	let importing = $state(false);
	let importError = $state('');
	let importSuccess = $state(false);
	let showImportConfirm = $state(false);
	/** @type {HTMLInputElement | undefined} */
	let fileInput = $state();
	/** @type {any} */
	let pendingImportData = $state(null);

	/** @param {Event} e */
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

<h1 class="text-2xl font-bold mb-4">Settings</h1>

<!-- Tab navigation -->
<div class="flex gap-1.5 mb-4 overflow-x-auto">
	{#each [{ id: 'payment', label: 'Payment' }, { id: 'rates', label: 'Rates' }, { id: 'customers', label: 'Customers' }, { id: 'ui', label: 'UI' }, { id: 'data', label: 'Data' }] as tab}
		<button
			class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
				{activeTab === tab.id
				? 'bg-primary text-primary-content'
				: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
			onclick={() => (activeTab = tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<!-- Payment Details -->
{#if activeTab === 'payment'}
	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-3">Payment Details</h2>
		<div class="flex flex-col gap-2">
			<div class="form-control">
				<label class="label" for="payment-name">
					<span class="label-text text-xs">Payment Name</span>
				</label>
				<input
					id="payment-name"
					type="text"
					class="input input-bordered input-sm w-full"
					placeholder="e.g. John Smith"
					bind:value={payment_name}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="account-number">
					<span class="label-text text-xs">Account Number</span>
				</label>
				<input
					id="account-number"
					type="text"
					class="input input-bordered input-sm w-full"
					placeholder="e.g. 12345678"
					bind:value={account_number}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="sort-code">
					<span class="label-text text-xs">Sort Code</span>
				</label>
				<input
					id="sort-code"
					type="text"
					class="input input-bordered input-sm w-full"
					placeholder="e.g. 12-34-56"
					bind:value={sort_code}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="address">
					<span class="label-text text-xs">Address</span>
				</label>
				<textarea
					id="address"
					class="textarea textarea-bordered textarea-sm w-full"
					rows="3"
					placeholder="e.g. 10 Downing Street&#10;London&#10;SW1A 2AA"
					bind:value={address}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="email">
					<span class="label-text text-xs">Email</span>
				</label>
				<input
					id="email"
					type="email"
					class="input input-bordered input-sm w-full"
					placeholder="e.g. you@example.com"
					bind:value={email}
				/>
			</div>
		</div>

		<div class="mt-4 flex items-center gap-2">
			<button class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
				{saving ? 'Saving...' : 'Save'}
			</button>
			{#if saved}
				<span class="text-xs text-success">Saved</span>
			{/if}
		</div>
	</div>
{/if}

<!-- Rates -->
{#if activeTab === 'rates'}
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
{/if}

<!-- Customers -->
{#if activeTab === 'customers'}
	<div class="flex flex-col gap-2">
		{#if customers.length === 0}
			<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
				<p class="text-sm text-base-content/40">No customers yet.</p>
			</div>
		{:else}
			{#each customers as c (c.id)}
				<div class="rounded-xl border border-base-content/10 bg-base-100 p-3">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<h3 class="font-bold text-xs">{c.name}</h3>
							<p class="text-[11px] text-base-content/50 mt-0.5">{c.email}</p>
							{#if c.address}
								<p class="text-[11px] text-base-content/40 whitespace-pre-line mt-1">{c.address}</p>
							{/if}
						</div>
						<div class="flex gap-1 shrink-0">
							<button class="btn btn-ghost btn-xs" onclick={() => openEdit(c)}>Edit</button>
							<button class="btn btn-ghost btn-xs text-error" onclick={() => openDelete(c)}
								>Delete</button
							>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
{/if}

<!-- UI -->
{#if activeTab === 'ui'}
	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-3">Appearance</h2>
		<div class="form-control">
			<span class="label">
				<span class="label-text text-xs">Colour Theme</span>
			</span>
			<div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
				{#each themes as theme}
					<button
						class="rounded-lg overflow-hidden border-2 transition-all {selectedTheme === theme
							? 'border-primary ring-1 ring-primary/30'
							: 'border-base-content/10 hover:border-base-content/20'}"
						onclick={() => applyTheme(theme)}
						data-theme={theme}
					>
						<div class="bg-base-100 p-2">
							<div class="flex items-center justify-between mb-1.5">
								<span class="text-[10px] font-medium text-base-content truncate">
									{theme.charAt(0).toUpperCase() + theme.slice(1)}
								</span>
								{#if selectedTheme === theme}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 16 16"
										fill="currentColor"
										class="w-3 h-3 text-primary shrink-0"
									>
										<path
											fill-rule="evenodd"
											d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</div>
							<div class="flex gap-1">
								<span class="size-3 rounded-full bg-primary"></span>
								<span class="size-3 rounded-full bg-secondary"></span>
								<span class="size-3 rounded-full bg-accent"></span>
								<span class="size-3 rounded-full bg-neutral"></span>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4 mt-3">
		<h2 class="text-sm font-semibold text-base-content/60 mb-3">Image Upload Size</h2>
		<p class="text-[11px] text-base-content/40 mb-3">
			Maximum resolution for uploaded images. Larger images will be resized.
		</p>
		<div class="flex flex-col gap-2">
			{#each [{ value: 'small', label: 'Small', desc: '800px max' }, { value: 'medium', label: 'Medium', desc: '1200px max' }, { value: 'large', label: 'Large', desc: '1600px max' }] as option}
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="radio"
						name="image-size"
						class="radio radio-sm radio-primary"
						value={option.value}
						checked={selectedImageSize === option.value}
						onchange={() =>
							setImageSize(/** @type {'small' | 'medium' | 'large'} */ (option.value))}
					/>
					<div>
						<span class="text-sm font-medium">{option.label}</span>
						<span class="text-[11px] text-base-content/40 ml-1.5">{option.desc}</span>
					</div>
				</label>
			{/each}
		</div>
	</div>
{/if}

<!-- Data -->
{#if activeTab === 'data'}
	<div class="flex flex-col gap-3">
		<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
			<h2 class="text-sm font-semibold text-base-content/60 mb-1">Export</h2>
			<p class="text-[11px] text-base-content/40 mb-3">
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

		<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
			<h2 class="text-sm font-semibold text-base-content/60 mb-1">Import</h2>
			<p class="text-[11px] text-base-content/40 mb-3">
				Restore from a backup file. This will replace all existing data.
			</p>
			<button
				class="btn btn-sm btn-outline"
				onclick={() => fileInput?.click()}
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
				<div class="alert alert-error mt-3 text-xs">{importError}</div>
			{/if}
			{#if importSuccess}
				<div class="alert alert-success mt-3 text-xs">Data restored successfully.</div>
			{/if}
		</div>
	</div>
{/if}

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
