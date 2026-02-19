<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
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
	import {
		get_shift_patterns,
		create_shift_pattern,
		update_shift_pattern,
		delete_shift_pattern,
		reorder_shift_patterns
	} from '$lib/funcs/shift_patterns.remote';

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

	// Calendar feed
	const calendarFeedUrl = $derived(page.url.origin + '/calendar/feed');
	const webcalUrl = $derived(calendarFeedUrl.replace(/^https?:\/\//, 'webcal://'));
	const googleCalUrl = $derived(
		'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarFeedUrl)
	);
	let calendarCopied = $state(false);

	async function copyCalendarUrl() {
		await navigator.clipboard.writeText(calendarFeedUrl);
		calendarCopied = true;
		setTimeout(() => (calendarCopied = false), 2000);
	}

	// Shift Patterns
	const shiftsData = get_shift_patterns();
	const shifts = $derived(shiftsData.current ?? []);

	const COLOR_CLASSES = {
		primary: 'bg-primary',
		secondary: 'bg-secondary',
		success: 'bg-success',
		error: 'bg-error',
		warning: 'bg-warning',
		info: 'bg-info'
	};

	/** @type {HTMLDialogElement} */
	let editShiftModal;
	/** @type {HTMLDialogElement} */
	let deleteShiftModal;

	let editShiftId = $state('');
	let editShiftTitle = $state('');
	let editShiftStartTime = $state('');
	let editShiftEndTime = $state('');
	/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */
	let editShiftColor = $state('primary');
	let editShiftIcon = $state('');
	let editShiftSaving = $state(false);

	let deleteShiftId = $state('');
	let deleteShiftTitle = $state('');
	let deletingShift = $state(false);

	/** @type {string | null} */
	let draggedId = $state(null);

	/**
	 * @param {{id: string, title: string, start_time: string, end_time: string, color: string, icon: string | null}} s
	 */
	function openEditShift(s) {
		editShiftId = s.id;
		editShiftTitle = s.title;
		editShiftStartTime = s.start_time;
		editShiftEndTime = s.end_time;
		editShiftColor =
			/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (s.color);
		editShiftIcon = s.icon || '';
		editShiftSaving = false;
		editShiftModal.showModal();
	}

	async function saveEditShift() {
		editShiftSaving = true;
		await update_shift_pattern({
			id: editShiftId,
			title: editShiftTitle,
			start_time: editShiftStartTime,
			end_time: editShiftEndTime,
			color: editShiftColor,
			icon: editShiftIcon
		});
		editShiftSaving = false;
		editShiftModal.close();
	}

	/**
	 * @param {{id: string, title: string}} s
	 */
	function openDeleteShift(s) {
		deleteShiftId = s.id;
		deleteShiftTitle = s.title;
		deletingShift = false;
		deleteShiftModal.showModal();
	}

	async function confirmDeleteShift() {
		deletingShift = true;
		await delete_shift_pattern({ id: deleteShiftId });
		deletingShift = false;
		deleteShiftModal.close();
	}

	/**
	 * @param {DragEvent} e
	 * @param {string} id
	 */
	function handleDragStart(e, id) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	/**
	 * @param {DragEvent} e
	 * @param {string} targetId
	 */
	function handleDragOver(e, targetId) {
		e.preventDefault();
		if (!draggedId || draggedId === targetId) return;

		const draggedIndex = shifts.findIndex((s) => s.id === draggedId);
		const targetIndex = shifts.findIndex((s) => s.id === targetId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		// Optimistic reorder
		const newShifts = [...shifts];
		const [removed] = newShifts.splice(draggedIndex, 1);
		newShifts.splice(targetIndex, 0, removed);

		// Update the sort order on the server
		reorder_shift_patterns({ ids: newShifts.map((s) => s.id) });
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDrop(e) {
		e.preventDefault();
		draggedId = null;
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
	{#each [{ id: 'payment', label: 'Payment' }, { id: 'rates', label: 'Rates' }, { id: 'shifts', label: 'Shift Patterns' }, { id: 'customers', label: 'Customers' }, { id: 'ui', label: 'UI' }, { id: 'data', label: 'Data' }] as tab}
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

<!-- Shift Patterns -->
{#if activeTab === 'shifts'}
	<div class="flex flex-col gap-3">
		<!-- Existing Patterns List -->
		{#if shifts.length > 0}
			<div class="flex flex-col gap-2">
				{#each shifts as shift (shift.id)}
					<div
						role="listitem"
						class="rounded-xl border border-base-content/10 bg-base-100 p-3 cursor-move"
						draggable="true"
						ondragstart={(e) => handleDragStart(e, shift.id)}
						ondragover={(e) => handleDragOver(e, shift.id)}
						ondrop={handleDrop}
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3 min-w-0">
								<span class="text-base-content/40 cursor-grab">⠿</span>
								<div class="flex items-center gap-2 min-w-0">
									{#if shift.icon}
										<span class="text-lg">{shift.icon}</span>
									{/if}
									<h3 class="font-bold text-sm">{shift.title}</h3>
								</div>
								<span
									class="size-4 rounded-full shrink-0 {COLOR_CLASSES[
										/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
											shift.color
										)
									]}"
								></span>
								<span class="text-xs text-base-content/60">
									{shift.start_time} – {shift.end_time}
								</span>
							</div>
							<div class="flex gap-1 shrink-0">
								<button class="btn btn-ghost btn-xs" onclick={() => openEditShift(shift)}
									>Edit</button
								>
								<button
									class="btn btn-ghost btn-xs text-error"
									onclick={() => openDeleteShift(shift)}>Delete</button
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Create New Pattern -->
		<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
			<h2 class="text-sm font-semibold text-base-content/60 mb-3">Create Shift Pattern</h2>
			<form {...create_shift_pattern}>
				<div class="flex flex-col gap-3">
					<div class="form-control">
						<label class="label" for="shift-title">
							<span class="label-text text-xs">Title</span>
						</label>
						<input
							id="shift-title"
							{...create_shift_pattern.fields.title.as('text')}
							class="input input-bordered input-sm w-full"
							placeholder="e.g. Night Shift"
						/>
					</div>

					<div class="flex gap-2">
						<div class="form-control flex-1">
							<label class="label" for="shift-start">
								<span class="label-text text-xs">Start Time</span>
							</label>
							<input
								id="shift-start"
								{...create_shift_pattern.fields.start_time.as('time')}
								class="input input-bordered input-sm w-full"
							/>
						</div>

						<div class="form-control flex-1">
							<label class="label" for="shift-end">
								<span class="label-text text-xs">End Time</span>
							</label>
							<input
								id="shift-end"
								{...create_shift_pattern.fields.end_time.as('time')}
								class="input input-bordered input-sm w-full"
							/>
						</div>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text text-xs">Colour</span>
						</label>
						<div class="flex gap-2">
							{#each ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as colorOption}
								<label class="cursor-pointer">
									<input
										{...create_shift_pattern.fields.color.as('radio', colorOption)}
										class="hidden peer"
									/>
									<span
										class="size-8 rounded-full block border-2 border-transparent peer-checked:border-base-content transition-all {COLOR_CLASSES[
											/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
												colorOption
											)
										]}"
									></span>
								</label>
							{/each}
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="shift-icon">
							<span class="label-text text-xs">Icon (optional emoji/character)</span>
						</label>
						<input
							id="shift-icon"
							{...create_shift_pattern.fields.icon.as('text')}
							class="input input-bordered input-sm w-20"
							maxlength="2"
							placeholder="🌃"
						/>
					</div>

					<button type="submit" class="btn btn-primary btn-sm">Create Pattern</button>
				</div>
			</form>
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

		<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
			<h2 class="text-sm font-semibold text-base-content/60 mb-1">Calendar Sync</h2>
			<p class="text-[11px] text-base-content/40 mb-3">
				Subscribe to your shifts in Apple Calendar, Google Calendar, or any app that supports iCal
				feeds. Only working shifts are included.
			</p>
			<div class="flex gap-2 mb-3">
				<a href={webcalUrl} class="btn btn-primary btn-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-4"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
						/>
					</svg>
					Apple Calendar
				</a>
				<a
					href={googleCalUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-primary btn-sm"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Google Calendar
				</a>
			</div>
			<div class="form-control">
				<label class="label" for="calendar-url">
					<span class="label-text text-xs">Feed URL</span>
				</label>
				<div class="flex gap-2">
					<input
						id="calendar-url"
						type="text"
						class="input input-bordered input-sm w-full font-mono text-xs"
						readonly
						value={calendarFeedUrl}
					/>
					<button class="btn btn-sm btn-outline shrink-0" onclick={copyCalendarUrl}>
						{calendarCopied ? 'Copied!' : 'Copy'}
					</button>
				</div>
				<p class="text-[11px] text-base-content/40 mt-2">
					Or copy the URL above to add manually in any calendar app.
				</p>
			</div>
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

<!-- Edit Shift Pattern Modal -->
<dialog bind:this={editShiftModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit Shift Pattern</h3>
		<div class="form-control mt-4">
			<label class="label" for="edit-shift-title">
				<span class="label-text">Title</span>
			</label>
			<input
				id="edit-shift-title"
				type="text"
				class="input input-bordered input-sm w-full"
				bind:value={editShiftTitle}
			/>
		</div>
		<div class="flex gap-2 mt-2">
			<div class="form-control flex-1">
				<label class="label" for="edit-shift-start">
					<span class="label-text">Start Time</span>
				</label>
				<input
					id="edit-shift-start"
					type="time"
					class="input input-bordered input-sm w-full"
					bind:value={editShiftStartTime}
				/>
			</div>
			<div class="form-control flex-1">
				<label class="label" for="edit-shift-end">
					<span class="label-text">End Time</span>
				</label>
				<input
					id="edit-shift-end"
					type="time"
					class="input input-bordered input-sm w-full"
					bind:value={editShiftEndTime}
				/>
			</div>
		</div>
		<div class="form-control mt-2">
			<label class="label">
				<span class="label-text">Colour</span>
			</label>
			<div class="flex gap-2">
				{#each ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as colorOption}
					<label class="cursor-pointer">
						<input
							type="radio"
							name="edit-color"
							value={colorOption}
							bind:group={editShiftColor}
							class="hidden peer"
						/>
						<span
							class="size-8 rounded-full block border-2 border-transparent peer-checked:border-base-content transition-all {COLOR_CLASSES[
								/** @type {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} */ (
									colorOption
								)
							]}"
						></span>
					</label>
				{/each}
			</div>
		</div>
		<div class="form-control mt-2">
			<label class="label" for="edit-shift-icon">
				<span class="label-text">Icon (optional)</span>
			</label>
			<input
				id="edit-shift-icon"
				type="text"
				class="input input-bordered input-sm w-20"
				maxlength="2"
				bind:value={editShiftIcon}
			/>
		</div>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => editShiftModal.close()}
				>Cancel</button
			>
			<button class="btn btn-primary btn-sm" onclick={saveEditShift} disabled={editShiftSaving}>
				{editShiftSaving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Delete Shift Pattern Modal -->
<dialog bind:this={deleteShiftModal} class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Delete Shift Pattern</h3>
		<p class="mt-4">Are you sure you want to delete <strong>{deleteShiftTitle}</strong>?</p>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => deleteShiftModal.close()}
				>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={confirmDeleteShift} disabled={deletingShift}>
				{deletingShift ? 'Deleting...' : 'Delete'}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
